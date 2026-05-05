import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, MessageCircle, MessageSquareShare, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Textarea } from '../components/ui/textarea';
import {
  CopimMemberIdentity,
  CopimPageHeader,
  formatCopimDateTime,
  getCopimAvatarDataUri,
} from '../components/copim/CopimModulePrimitives';

export const CopimAssociationCommunityPage = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState('association');
  const [composer, setComposer] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentingId, setCommentingId] = useState(null);

  const loadCommunity = useCallback(async (channelId) => {
    try {
      const response = await api.get('/copim/local-association/community', {
        params: { channel_id: channelId },
      });
      setData(response.data);
      setSelectedChannel(response.data?.selected_channel || channelId);
    } catch (error) {
      console.error('Error loading local community:', error);
      toast.error(error.response?.data?.detail || 'No se pudo cargar la comunidad');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void loadCommunity('association');
  }, [loadCommunity]);

  const handleCreatePost = async () => {
    if (!composer.trim()) {
      return;
    }
    setPosting(true);
    try {
      await api.post('/copim/local-association/community/posts', {
        channel_id: 'association',
        content: composer,
      });
      toast.success('Publicacion creada');
      setComposer('');
      await loadCommunity('association');
    } catch (error) {
      console.error('Error creating local post:', error);
      toast.error(error.response?.data?.detail || 'No se pudo crear la publicacion');
    } finally {
      setPosting(false);
    }
  };

  const handleComment = async (postId) => {
    const content = commentDrafts[postId]?.trim();
    if (!content) {
      return;
    }
    setCommentingId(postId);
    try {
      await api.post(`/copim/local-association/community/posts/${postId}/comments`, { content });
      setCommentDrafts((current) => ({ ...current, [postId]: '' }));
      toast.success('Comentario agregado');
      await loadCommunity(selectedChannel);
    } catch (error) {
      console.error('Error commenting local post:', error);
      toast.error(error.response?.data?.detail || 'No se pudo enviar el comentario');
    } finally {
      setCommentingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-40 w-full rounded-[28px]" />
        <Skeleton className="h-[640px] w-full rounded-[28px]" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const association = data.association || {};
  const channels = data.channels || [];
  const permissions = data.permissions || {};
  const posts = data.posts || [];
  const activeChannel = channels.find((channel) => channel.id === selectedChannel) || channels[0];

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        eyebrow="Asociacion local"
        title="Comunidad del capitulo"
        description={`Canales simples y utiles para ${association.name || 'tu asociacion'} con permiso de publicar en su espacio local y comentar en la red general.`}
        actions={(
          <>
            <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/events')}>
              Abrir agenda
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/members')}>
              Ver padron
            </Button>
          </>
        )}
        stats={[
          { label: 'Canales visibles', value: channels.length, helper: 'General, local y operativos' },
          { label: 'Canal activo', value: activeChannel?.label || 'Asociacion', helper: activeChannel?.description || 'Sin descripcion' },
          { label: 'Posts visibles', value: posts.length, helper: 'Feed del canal seleccionado' },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[0.34fr_0.66fr]">
        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle>Canales y permisos</CardTitle>
            <CardDescription>La asociacion puede publicar en su canal local y comentar en general.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {channels.map((channel) => (
              <button
                key={channel.id}
                type="button"
                onClick={() => {
                  setLoading(true);
                  void loadCommunity(channel.id);
                }}
                className={`w-full rounded-3xl border p-4 text-left transition ${
                  selectedChannel === channel.id
                    ? 'border-primary bg-primary/8'
                    : 'border-border/70 bg-muted/20 hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{channel.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{channel.description}</p>
                  </div>
                  <Badge className="rounded-full bg-slate-100 text-slate-900">{channel.count}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full">{channel.can_view ? 'Ver' : 'Oculto'}</Badge>
                  <Badge variant="outline" className="rounded-full">{channel.can_comment ? 'Comentar' : 'Solo lectura'}</Badge>
                  <Badge className={`rounded-full ${channel.can_post ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-900'}`}>
                    {channel.can_post ? 'Publicar' : 'Sin publicar'}
                  </Badge>
                </div>
              </button>
            ))}

            <div className="rounded-3xl border border-border/70 bg-slate-950 p-4 text-white">
              <div className="flex items-center gap-2 text-white/80">
                <Sparkles className="h-4 w-4" />
                <p className="font-medium">Permisos del rol Asociacion Local</p>
              </div>
              <div className="mt-4 space-y-2 text-sm text-white/72">
                <p>{permissions.can_comment_general ? 'Si' : 'No'} puede comentar en comunidad general</p>
                <p>{permissions.can_post_in_association ? 'Si' : 'No'} puede publicar en su canal local</p>
                <p>{permissions.can_post_in_general ? 'Si' : 'No'} puede publicar en canal general</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/70 bg-card/95">
            <CardHeader>
              <CardTitle>{activeChannel?.label || 'Canal local'}</CardTitle>
              <CardDescription>{activeChannel?.description || 'Feed operativo del capitulo'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedChannel === 'association' && permissions.can_post_in_association ? (
                <div className="rounded-[28px] border border-border/70 bg-muted/20 p-5">
                  <div className="flex items-start gap-3">
                    <img
                      src={getCopimAvatarDataUri(user?.name || association.name)}
                      alt={user?.name || association.name}
                      className="h-11 w-11 rounded-full"
                    />
                    <div className="flex-1 space-y-3">
                      <Textarea
                        rows={4}
                        value={composer}
                        onChange={(event) => setComposer(event.target.value)}
                        placeholder="Que quieres compartir con la comunidad local?"
                        className="rounded-3xl border-border/70 bg-background/80"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Solo publica en el canal del capitulo</p>
                        <Button className="rounded-full" onClick={handleCreatePost} disabled={posting}>
                          <Send className="mr-2 h-4 w-4" />
                          {posting ? 'Publicando...' : 'Publicar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[28px] border border-dashed border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    En este canal puedes leer y comentar, pero no publicar.
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="border-border/70 bg-background/80 shadow-none">
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <CopimMemberIdentity
                          name={post.author_name}
                          subtitle={`${post.author_role || 'asociacion'} · ${formatCopimDateTime(post.created_at)}`}
                          avatarUrl={post.author_avatar_url}
                        />
                        <Badge className="rounded-full bg-slate-100 text-slate-900">{post.channel_id}</Badge>
                      </div>
                      <p className="text-sm leading-7 text-foreground">{post.content}</p>

                      <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <MessageCircle className="h-4 w-4" />
                          {post.comment_count || 0} comentarios
                        </div>
                        <div className="space-y-3">
                          {(post.comments || []).map((comment) => (
                            <div key={comment.id} className="rounded-2xl border border-border/70 bg-background/80 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-medium text-foreground">{comment.author_name}</p>
                                <p className="text-xs text-muted-foreground">{formatCopimDateTime(comment.created_at)}</p>
                              </div>
                              <p className="mt-2 text-sm leading-7 text-muted-foreground">{comment.content}</p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex flex-col gap-3 md:flex-row">
                          <Input
                            value={commentDrafts[post.id] || ''}
                            onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
                            placeholder="Escribe un comentario"
                            className="rounded-full border-border/70 bg-background/80"
                          />
                          <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => handleComment(post.id)}
                            disabled={commentingId === post.id}
                          >
                            {commentingId === post.id ? 'Enviando...' : 'Comentar'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {!posts.length ? (
            <Card className="border-dashed border-border/70 bg-card/80">
              <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <MessageSquareShare className="h-8 w-8 text-muted-foreground" />
                <p className="text-lg font-semibold">Aun no hay actividad en este canal</p>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                  Usa el canal local para compartir avances del capitulo, recordatorios de agenda o avisos de renovacion.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
};
