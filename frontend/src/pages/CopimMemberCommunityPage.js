import React, { useCallback, useEffect, useState } from 'react';
import { Lock, MessageCircle, MessageSquareShare, Send, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import {
  CopimMemberIdentity,
  CopimPageHeader,
  formatCopimDateTime,
} from '../components/copim/CopimModulePrimitives';

export const CopimMemberCommunityPage = () => {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState('association');
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentingId, setCommentingId] = useState(null);

  const loadCommunity = useCallback(async (channelId) => {
    try {
      const response = await api.get('/copim/member-portal/community', {
        params: { channel_id: channelId },
      });
      setData(response.data);
      setSelectedChannel(response.data?.selected_channel || channelId);
    } catch (error) {
      console.error('Error loading member community:', error);
      toast.error(error.response?.data?.detail || 'No se pudo cargar la comunidad');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void loadCommunity('association');
  }, [loadCommunity]);

  const handleComment = async (postId) => {
    const content = commentDrafts[postId]?.trim();
    if (!content) {
      return;
    }
    setCommentingId(postId);
    try {
      await api.post(`/copim/member-portal/community/posts/${postId}/comments`, { content });
      setCommentDrafts((current) => ({ ...current, [postId]: '' }));
      toast.success('Comentario agregado');
      await loadCommunity(selectedChannel);
    } catch (error) {
      console.error('Error commenting member community:', error);
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

  const member = data.member || {};
  const channels = data.channels || [];
  const permissions = data.permissions || {};
  const posts = data.posts || [];
  const activeChannel = channels.find((channel) => channel.id === selectedChannel) || channels[0];

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        eyebrow="Portal del asociado"
        title="Mi comunidad"
        description="Sigue comunicados, comenta donde corresponda y mantente conectado con tu asociación y la red general sin cargar una experiencia social compleja."
        stats={[
          { label: 'Canales', value: channels.length, helper: 'Rutas visibles para tu rol' },
          { label: 'Canal activo', value: activeChannel?.label || 'Mi asociación', helper: activeChannel?.description || 'Sin descripción' },
          { label: 'Posts visibles', value: posts.length, helper: 'Feed filtrado' },
          { label: 'Permiso', value: 'Comentar', helper: 'Sin publicar posts' },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[0.34fr_0.66fr]">
        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle>Canales y permisos</CardTitle>
            <CardDescription>Como asociado puedes ver y comentar, pero la publicación queda reservada para administración y asociación.</CardDescription>
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
                    : 'border-border/70 bg-muted/20 hover:border-primary/40'
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
                  <Badge className="rounded-full bg-slate-100 text-slate-900">Sin publicar</Badge>
                </div>
              </button>
            ))}

            <div className="rounded-3xl border border-border/70 bg-slate-950 p-4 text-white">
              <div className="flex items-center gap-2 text-white">
                <ShieldCheck className="h-4 w-4" />
                <p className="font-medium">Permisos del asociado</p>
              </div>
              <div className="mt-4 space-y-2 text-sm text-white/72">
                <p>{permissions.can_comment_general ? 'Sí' : 'No'} puede comentar en general</p>
                <p>{permissions.can_comment_association ? 'Sí' : 'No'} puede comentar en su asociación</p>
                <p>{permissions.can_post_in_general ? 'Sí' : 'No'} puede publicar en general</p>
                <p>{permissions.can_post_in_association ? 'Sí' : 'No'} puede publicar en asociación</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/70 bg-card/95">
            <CardHeader>
              <CardTitle>{activeChannel?.label || 'Mi asociación'}</CardTitle>
              <CardDescription>{activeChannel?.description || 'Feed institucional del canal seleccionado'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[28px] border border-dashed border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Tu rol puede leer y comentar, pero no crear publicaciones nuevas en esta fase.
                </div>
              </div>

              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="border-border/70 bg-background/80 shadow-none">
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <CopimMemberIdentity
                          name={post.author_name}
                          subtitle={`${post.author_role || 'copim'} · ${formatCopimDateTime(post.created_at)}`}
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

                        {activeChannel?.can_comment ? (
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
                              <Send className="mr-2 h-4 w-4" />
                              {commentingId === post.id ? 'Enviando...' : 'Comentar'}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {!posts.length ? (
            <Card className="border-border/70 bg-card/95">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No hay publicaciones en este canal por ahora. Cambia de canal para revisar otros comunicados y conversaciones activas.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
};
