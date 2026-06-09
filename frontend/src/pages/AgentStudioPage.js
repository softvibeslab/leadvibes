import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Database,
  FileCode2,
  FileText,
  History,
  Loader2,
  MessageSquare,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UploadCloud,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';

const getErrorMessage = (error, fallback) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (error?.message) return error.message;
  return fallback;
};

const defaultForm = {
  name: '',
  description: '',
  role_scope: '',
  hermes_profile_name: '',
  system_prompt: '',
  customer_prompt: '',
  tone_instructions: '',
  enabled_skills: [],
  tools: {},
  model: '',
  provider: '',
  temperature: 0.25,
  is_active: true,
};

const syncConfig = {
  synced: { label: 'Sincronizado', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' },
  pending: { label: 'Pendiente', className: 'border-amber-500/30 bg-amber-500/10 text-amber-700' },
};

export const AgentStudioPage = () => {
  const { api, user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [skillCatalog, setSkillCatalog] = useState([]);
  const [toolCatalog, setToolCatalog] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [knowledgeFiles, setKnowledgeFiles] = useState([]);
  const [graphifyCommand, setGraphifyCommand] = useState('');
  const [uploadFiles, setUploadFiles] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [busy, setBusy] = useState('');

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedId) || null,
    [profiles, selectedId],
  );

  const groupedSkills = useMemo(() => {
    const groups = {};
    skillCatalog.forEach((skill) => {
      const groupName = skill.subcategory || (skill.category === 'multimedia' ? 'Multimedia' : 'Skills comerciales');
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(skill);
    });
    const priority = ['Skills comerciales', 'Archivos', 'Imagenes', 'Audio', 'Video', 'Links'];
    return Object.entries(groups).sort(([a], [b]) => {
      const ai = priority.indexOf(a);
      const bi = priority.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [skillCatalog]);

  const loadStudio = useCallback(async () => {
    const [profilesResponse, auditResponse] = await Promise.all([
      api.get('/agent-studio/profiles'),
      api.get('/agent-studio/audit').catch(() => ({ data: { logs: [] } })),
    ]);
    const nextProfiles = profilesResponse.data?.profiles || [];
    setProfiles(nextProfiles);
    setSkillCatalog(profilesResponse.data?.skill_catalog || []);
    setToolCatalog(profilesResponse.data?.tool_catalog || []);
    setAuditLogs(auditResponse.data?.logs || []);
    setSelectedId((current) => current || nextProfiles[0]?.id || '');
  }, [api]);

  useEffect(() => {
    setBusy('load');
    void loadStudio()
      .catch((error) => toast.error(getErrorMessage(error, 'No pude cargar Agent Studio')))
      .finally(() => setBusy(''));
  }, [loadStudio]);

  useEffect(() => {
    if (!selectedProfile) {
      setForm(defaultForm);
      setKnowledgeFiles([]);
      setGraphifyCommand('');
      setChatMessages([]);
      return;
    }
    setForm({
      ...defaultForm,
      ...selectedProfile,
      enabled_skills: selectedProfile.enabled_skills || [],
      tools: selectedProfile.tools || {},
    });
    setChatMessages([]);
  }, [selectedProfile]);

  const loadKnowledge = useCallback(async () => {
    if (!selectedProfile) return;
    const response = await api.get(`/agent-studio/profiles/${selectedProfile.id}/knowledge`);
    setKnowledgeFiles(response.data?.files || []);
    setGraphifyCommand(response.data?.graphify_command || '');
  }, [api, selectedProfile]);

  useEffect(() => {
    void loadKnowledge().catch(() => {
      setKnowledgeFiles([]);
      setGraphifyCommand('');
    });
  }, [loadKnowledge]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleSkill = (skillId) => {
    setForm((current) => {
      const existing = current.enabled_skills || [];
      const enabled_skills = existing.includes(skillId)
        ? existing.filter((item) => item !== skillId)
        : [...existing, skillId];
      return { ...current, enabled_skills };
    });
  };

  const toggleTool = (toolId, checked) => {
    setForm((current) => ({ ...current, tools: { ...(current.tools || {}), [toolId]: checked } }));
  };

  const saveProfile = async () => {
    if (!selectedProfile) return;
    setBusy('save');
    try {
      const response = await api.put(`/agent-studio/profiles/${selectedProfile.id}`, {
        name: form.name,
        description: form.description,
        role_scope: form.role_scope,
        hermes_profile_name: form.hermes_profile_name,
        system_prompt: form.system_prompt,
        customer_prompt: form.customer_prompt,
        tone_instructions: form.tone_instructions,
        enabled_skills: form.enabled_skills,
        tools: form.tools,
        model: form.model,
        provider: form.provider,
        temperature: Number(form.temperature || 0.25),
        is_active: form.is_active,
      });
      setProfiles((current) => current.map((profile) => (profile.id === selectedProfile.id ? response.data.profile : profile)));
      toast.success('Perfil guardado');
      await loadStudio();
    } catch (error) {
      toast.error(getErrorMessage(error, 'No pude guardar el perfil'));
    } finally {
      setBusy('');
    }
  };

  const syncProfile = async () => {
    if (!selectedProfile) return;
    setBusy('sync');
    try {
      const response = await api.post(`/agent-studio/profiles/${selectedProfile.id}/sync`);
      setProfiles((current) => current.map((profile) => (profile.id === selectedProfile.id ? response.data.profile : profile)));
      toast.success('Perfil sincronizado con Hermes');
      await loadStudio();
    } catch (error) {
      toast.error(getErrorMessage(error, 'No pude sincronizar con Hermes'));
    } finally {
      setBusy('');
    }
  };

  const sendTestMessage = async () => {
    if (!selectedProfile || !chatInput.trim()) return;
    const userMessage = {
      id: `local-user-${Date.now()}`,
      role: 'user',
      content: chatInput.trim(),
    };
    setChatMessages((current) => [...current, userMessage]);
    setChatInput('');
    setBusy('chat');
    try {
      const response = await api.post(`/agent-studio/profiles/${selectedProfile.id}/chat`, {
        message: userMessage.content,
        include_knowledge: true,
      });
      setChatMessages((current) => [
        ...current,
        {
          id: response.data?.message?.id || `local-agent-${Date.now()}`,
          role: 'assistant',
          content: response.data?.response || '',
          knowledge_used: response.data?.knowledge_used || [],
          provider: response.data?.provider,
        },
      ]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No pude probar el agente'));
      setChatMessages((current) => current.filter((item) => item.id !== userMessage.id));
    } finally {
      setBusy('');
    }
  };

  const uploadKnowledge = async () => {
    if (!selectedProfile || uploadFiles.length === 0) return;
    const body = new FormData();
    uploadFiles.forEach((file) => body.append('files', file));
    setBusy('knowledge');
    try {
      const response = await api.post(`/agent-studio/profiles/${selectedProfile.id}/knowledge`, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setKnowledgeFiles((current) => [...(response.data?.uploaded || []), ...current]);
      setGraphifyCommand(response.data?.graphify_command || graphifyCommand);
      setUploadFiles([]);
      toast.success('Base de conocimiento cargada');
      await loadStudio();
    } catch (error) {
      toast.error(getErrorMessage(error, 'No pude subir la base de conocimiento'));
    } finally {
      setBusy('');
    }
  };

  const status = syncConfig[selectedProfile?.sync_status] || syncConfig.pending;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <SlidersHorizontal className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Agent Studio</h1>
              <p className="text-sm text-muted-foreground">
                Administracion de prompts, skills y perfiles Hermes · {user?.active_workspace?.name || user?.name}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void loadStudio()} disabled={busy === 'load'}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <Button variant="outline" onClick={saveProfile} disabled={!selectedProfile || busy === 'save'}>
              {busy === 'save' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar
            </Button>
            <Button onClick={syncProfile} disabled={!selectedProfile || busy === 'sync'}>
              {busy === 'sync' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              Sincronizar Hermes
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Perfiles</CardTitle>
                <CardDescription>Solo rol admin puede entrar y editar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {profiles.map((profile) => {
                  const itemStatus = syncConfig[profile.sync_status] || syncConfig.pending;
                  return (
                    <button
                      type="button"
                      key={profile.id}
                      onClick={() => setSelectedId(profile.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        selectedId === profile.id ? 'border-primary/40 bg-primary/10' : 'hover:border-primary/30 hover:bg-primary/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{profile.name}</p>
                          <p className="text-xs text-muted-foreground">{profile.role_scope}</p>
                        </div>
                        <Badge className={itemStatus.className}>{itemStatus.label}</Badge>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Auditoria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {auditLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin cambios registrados.</p>
                ) : (
                  auditLogs.slice(0, 6).map((log) => (
                    <div key={log.id} className="flex gap-3 rounded-lg border p-3">
                      <History className="mt-0.5 h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground">{log.actor_email || 'admin'} · {new Date(log.created_at).toLocaleString('es-MX')}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>{selectedProfile?.name || 'Perfil'}</CardTitle>
                  <CardDescription>
                    Version {selectedProfile?.version || 1} · Hermes `{selectedProfile?.hermes_profile_name || 'sin perfil'}`
                  </CardDescription>
                </div>
                <Badge className={status.className}>
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  {status.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="prompts">
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
                  <TabsTrigger value="prompts">Prompts</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="tools">Tools</TabsTrigger>
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="knowledge">Conocimiento</TabsTrigger>
                  <TabsTrigger value="sync">Sync</TabsTrigger>
                </TabsList>

                <TabsContent value="prompts" className="mt-6 space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Nombre</Label>
                      <Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} />
                    </div>
                    <div>
                      <Label>Perfil Hermes</Label>
                      <Input value={form.hermes_profile_name} onChange={(event) => updateForm('hermes_profile_name', event.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Descripcion</Label>
                    <Input value={form.description} onChange={(event) => updateForm('description', event.target.value)} />
                  </div>
                  <div>
                    <Label>System prompt</Label>
                    <Textarea className="min-h-40" value={form.system_prompt} onChange={(event) => updateForm('system_prompt', event.target.value)} />
                  </div>
                  <div>
                    <Label>Customer prompt</Label>
                    <Textarea className="min-h-32" value={form.customer_prompt} onChange={(event) => updateForm('customer_prompt', event.target.value)} />
                  </div>
                  <div>
                    <Label>Instrucciones de tono</Label>
                    <Textarea className="min-h-24" value={form.tone_instructions} onChange={(event) => updateForm('tone_instructions', event.target.value)} />
                  </div>
                </TabsContent>

                <TabsContent value="skills" className="mt-6">
                  <div className="space-y-5">
                    {groupedSkills.map(([groupName, skills]) => (
                      <section key={groupName} className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">{groupName}</h3>
                            {['Archivos', 'Imagenes', 'Audio', 'Video', 'Links'].includes(groupName) && (
                              <p className="text-xs text-muted-foreground">
                                Habilita entrada multimodal para interpretar informacion antes de mapearla al CRM.
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary">{skills.length}</Badge>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {skills.map((skill) => {
                            const checked = (form.enabled_skills || []).includes(skill.id);
                            const isMultimedia = skill.category === 'multimedia';
                            return (
                              <button
                                type="button"
                                key={skill.id}
                                onClick={() => toggleSkill(skill.id)}
                                className={`rounded-lg border p-3 text-left transition-colors ${
                                  checked ? 'border-primary/40 bg-primary/10' : 'hover:border-primary/30 hover:bg-primary/5'
                                }`}
                              >
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <div className="flex min-w-0 items-center gap-2">
                                    {isMultimedia ? <UploadCloud className="h-4 w-4 shrink-0 text-primary" /> : <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                    <p className="truncate text-sm font-medium">{skill.label}</p>
                                  </div>
                                  {checked ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> : null}
                                </div>
                                <p className="line-clamp-3 text-xs text-muted-foreground">{skill.description}</p>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="tools" className="mt-6">
                  <div className="grid gap-3 md:grid-cols-2">
                    {toolCatalog.map((tool) => (
                      <div key={tool.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{tool.label}</p>
                            <p className="text-xs text-muted-foreground">Permiso operativo para el agente.</p>
                          </div>
                        </div>
                        <Switch checked={!!form.tools?.[tool.id]} onCheckedChange={(checked) => toggleTool(tool.id, checked)} />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="chat" className="mt-6 space-y-4">
                  <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                    <div className="rounded-lg border">
                      <div className="flex items-center justify-between border-b p-4">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <p className="text-sm font-medium">Prueba del agente</p>
                        </div>
                        <Badge variant="outline">{form.role_scope || 'perfil'}</Badge>
                      </div>
                      <div className="max-h-[420px] min-h-[300px] space-y-3 overflow-y-auto p-4">
                        {chatMessages.length === 0 ? (
                          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
                            <Bot className="mb-3 h-8 w-8 text-primary" />
                            <p className="text-sm font-medium">Pregunta algo para validar el prompt</p>
                            <p className="mt-1 max-w-md text-xs text-muted-foreground">
                              El agente usara el system prompt, customer prompt, skills, tools y archivos cargados para este perfil.
                            </p>
                          </div>
                        ) : (
                          chatMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`rounded-lg border p-3 ${
                                message.role === 'user' ? 'ml-auto max-w-[85%] bg-primary/10' : 'mr-auto max-w-[92%] bg-muted/25'
                              }`}
                            >
                              <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                {message.role === 'user' ? 'Admin' : selectedProfile?.name || 'Agente'}
                                {message.provider ? <Badge variant="outline">{message.provider}</Badge> : null}
                              </div>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                              {message.knowledge_used?.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {message.knowledge_used.map((source) => (
                                    <Badge key={`${source.file_id}-${source.chunk_index}`} variant="secondary">
                                      {source.filename || source.file_id}
                                    </Badge>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ))
                        )}
                        {busy === 'chat' ? (
                          <div className="mr-auto flex max-w-[92%] items-center gap-2 rounded-lg border bg-muted/25 p-3 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Probando respuesta del agente...
                          </div>
                        ) : null}
                      </div>
                      <div className="border-t p-4">
                        <div className="flex gap-2">
                          <Textarea
                            className="min-h-16"
                            value={chatInput}
                            onChange={(event) => setChatInput(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                                event.preventDefault();
                                void sendTestMessage();
                              }
                            }}
                            placeholder="Ej. Importa estos leads y dime que campos faltan..."
                          />
                          <Button className="h-auto self-stretch" onClick={sendTestMessage} disabled={busy === 'chat' || !chatInput.trim()}>
                            {busy === 'chat' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-lg border p-4">
                        <Database className="mb-3 h-5 w-5 text-primary" />
                        <p className="text-sm font-medium">Conocimiento activo</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {knowledgeFiles.length} archivo{knowledgeFiles.length === 1 ? '' : 's'} disponible{knowledgeFiles.length === 1 ? '' : 's'} para este perfil.
                        </p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
                        <p className="text-sm font-medium">Modo seguro</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Este chat no escribe datos reales; sirve para validar prompts antes de sincronizar Hermes.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="knowledge" className="mt-6 space-y-4">
                  <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4 text-primary" />
                              <p className="text-sm font-medium">Base de conocimiento del perfil</p>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Archivos para que el agente responda con contexto propio de la inmobiliaria.
                            </p>
                          </div>
                          <Button onClick={uploadKnowledge} disabled={busy === 'knowledge' || uploadFiles.length === 0}>
                            {busy === 'knowledge' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Subir
                          </Button>
                        </div>
                        <Input
                          className="mt-4"
                          type="file"
                          multiple
                          accept=".txt,.md,.csv,.json,.html,.xml,.xlsx,.xls,.pdf"
                          onChange={(event) => setUploadFiles(Array.from(event.target.files || []))}
                        />
                        {uploadFiles.length ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {uploadFiles.map((file) => file.name).join(', ')}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        {knowledgeFiles.length === 0 ? (
                          <div className="rounded-lg border border-dashed p-8 text-center">
                            <FileText className="mx-auto mb-3 h-8 w-8 text-primary" />
                            <p className="text-sm font-medium">Sin archivos cargados</p>
                            <p className="mt-1 text-xs text-muted-foreground">Sube scripts, FAQs, inventarios, políticas o bases comerciales.</p>
                          </div>
                        ) : (
                          knowledgeFiles.map((file) => (
                            <div key={file.id} className="flex items-center justify-between gap-3 rounded-lg border p-4">
                              <div className="flex min-w-0 items-start gap-3">
                                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">{file.filename}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {file.chunk_count || 0} chunks · {file.extracted_chars || 0} caracteres · {new Date(file.created_at).toLocaleString('es-MX')}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline">{file.graphify_status || 'pendiente'}</Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <Sparkles className="mb-3 h-5 w-5 text-primary" />
                        <p className="text-sm font-medium">Graphify</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          El corpus queda listo para generar graph.json, comunidades y reporte HTML con Graphify.
                        </p>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-4">
                        <p className="text-sm font-medium">Comando sugerido</p>
                        <pre className="mt-3 overflow-auto rounded-md bg-background p-3 text-xs text-muted-foreground">
                          {graphifyCommand || 'Carga archivos para preparar el corpus.'}
                        </pre>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sync" className="mt-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <Bot className="mb-3 h-5 w-5 text-primary" />
                      <p className="text-sm font-medium">Rol</p>
                      <p className="mt-1 text-sm text-muted-foreground">{form.role_scope}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <FileCode2 className="mb-3 h-5 w-5 text-primary" />
                      <p className="text-sm font-medium">Archivos</p>
                      <p className="mt-1 text-sm text-muted-foreground">SOUL.md, profile.yaml y JSON ROVI.</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <UploadCloud className="mb-3 h-5 w-5 text-primary" />
                      <p className="text-sm font-medium">Ultima sincronizacion</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedProfile?.last_synced_at ? new Date(selectedProfile.last_synced_at).toLocaleString('es-MX') : 'Pendiente'}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <p className="text-sm font-medium">Resultado Hermes</p>
                    <pre className="mt-3 overflow-auto rounded-md bg-background p-3 text-xs text-muted-foreground">
                      {JSON.stringify(selectedProfile?.hermes_sync || {}, null, 2)}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
