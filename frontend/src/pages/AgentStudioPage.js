import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Database,
  FileCode2,
  FileText,
  History,
  KeyRound,
  Loader2,
  Link2,
  MessageSquare,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UploadCloud,
  UserCog,
  Users,
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
  const [agentUsers, setAgentUsers] = useState([]);
  const [actionAudit, setActionAudit] = useState({ logs: [], pending_actions: [], webhook_updates: [] });
  const [selectedId, setSelectedId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [userSettingsDraft, setUserSettingsDraft] = useState({
    tools: {},
    preferences: '{}',
    memory: '{}',
    notes: '',
    is_active: true,
  });
  const [knowledgeFiles, setKnowledgeFiles] = useState([]);
  const [graphifyCommand, setGraphifyCommand] = useState('');
  const [uploadFiles, setUploadFiles] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [skillCategory, setSkillCategory] = useState('all');
  const [skillRoleFilter, setSkillRoleFilter] = useState('profile');
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);
  const [showEnabledOnly, setShowEnabledOnly] = useState(false);
  const [busy, setBusy] = useState('');

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedId) || null,
    [profiles, selectedId],
  );
  const selectedAgentUser = useMemo(
    () => agentUsers.find((item) => item.user?.id === selectedUserId) || null,
    [agentUsers, selectedUserId],
  );

  const activeSkillRole = skillRoleFilter === 'profile' ? form.role_scope : skillRoleFilter;

  const filteredSkills = useMemo(() => {
    const query = skillSearch.trim().toLowerCase();
    const enabledSet = new Set(form.enabled_skills || []);
    return skillCatalog.filter((skill) => {
      const isSuperpower = skill.category === 'superpowers' || skill.is_superpower;
      const recommendedRoles = skill.recommended_roles || [];
      const isRecommended = activeSkillRole && recommendedRoles.includes(activeSkillRole);
      const text = `${skill.label || ''} ${skill.description || ''} ${skill.subcategory || ''}`.toLowerCase();
      if (query && !text.includes(query)) return false;
      if (skillCategory === 'superpowers' && !isSuperpower) return false;
      if (skillCategory === 'commercial' && isSuperpower) return false;
      if (showRecommendedOnly && !isRecommended) return false;
      if (showEnabledOnly && !enabledSet.has(skill.id)) return false;
      return true;
    });
  }, [activeSkillRole, form.enabled_skills, showEnabledOnly, showRecommendedOnly, skillCatalog, skillCategory, skillSearch]);

  const groupedSkills = useMemo(() => {
    const sections = {
      superpowers: {},
      commercial: {},
    };
    filteredSkills.forEach((skill) => {
      const section = skill.category === 'superpowers' || skill.is_superpower ? 'superpowers' : 'commercial';
      const groupName = skill.subcategory || (section === 'superpowers' ? 'General' : 'General comercial');
      if (!sections[section][groupName]) sections[section][groupName] = [];
      sections[section][groupName].push(skill);
    });
    const superpowerPriority = ['Archivos', 'Imagenes', 'Audio', 'Video', 'Links'];
    const commercialPriority = [
      'Calificacion y seguimiento',
      'Seguimiento comercial',
      'Agenda y reuniones',
      'Inventario y propiedades',
      'Direccion comercial',
      'Estrategia y ofertas',
      'Gobernanza y riesgo',
      'COPIM',
      'ROVI interno',
      'Skills comerciales',
    ];
    const sortGroups = (groups, priority) => Object.entries(groups).sort(([a], [b]) => {
      const ai = priority.indexOf(a);
      const bi = priority.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    return [
      {
        id: 'superpowers',
        title: 'Superpoderes',
        description: 'Entrada multimodal para interpretar informacion antes de mapearla al CRM.',
        groups: sortGroups(sections.superpowers, superpowerPriority),
      },
      {
        id: 'commercial',
        title: 'Skills comerciales',
        description: 'Capacidades operativas sugeridas por rol, flujo y objetivo comercial.',
        groups: sortGroups(sections.commercial, commercialPriority),
      },
    ].filter((section) => section.groups.length > 0);
  }, [filteredSkills]);

  const loadStudio = useCallback(async () => {
    const [profilesResponse, usersResponse, actionAuditResponse, auditResponse] = await Promise.all([
      api.get('/agent-studio/profiles'),
      api.get('/agent-studio/users').catch(() => ({ data: { users: [] } })),
      api.get('/agent-studio/action-audit').catch(() => ({ data: { logs: [], pending_actions: [], webhook_updates: [] } })),
      api.get('/agent-studio/audit').catch(() => ({ data: { logs: [] } })),
    ]);
    const nextProfiles = profilesResponse.data?.profiles || [];
    const nextUsers = usersResponse.data?.users || [];
    setProfiles(nextProfiles);
    setAgentUsers(nextUsers);
    setSkillCatalog(profilesResponse.data?.skill_catalog || []);
    setToolCatalog(profilesResponse.data?.tool_catalog || []);
    setActionAudit(actionAuditResponse.data || { logs: [], pending_actions: [], webhook_updates: [] });
    setAuditLogs(auditResponse.data?.logs || []);
    setSelectedId((current) => current || nextProfiles[0]?.id || '');
    setSelectedUserId((current) => current || nextUsers[0]?.user?.id || '');
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

  useEffect(() => {
    if (!selectedAgentUser) return;
    const settings = selectedAgentUser.settings || {};
    setUserSettingsDraft({
      tools: settings.tools || selectedAgentUser.profile?.tools || {},
      preferences: JSON.stringify(settings.preferences || {}, null, 2),
      memory: JSON.stringify(settings.memory || {}, null, 2),
      notes: settings.notes || '',
      is_active: settings.is_active !== false,
    });
  }, [selectedAgentUser]);

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

  const toggleUserTool = (toolId, checked) => {
    setUserSettingsDraft((current) => ({ ...current, tools: { ...(current.tools || {}), [toolId]: checked } }));
  };

  const saveUserSettings = async () => {
    if (!selectedAgentUser) return;
    let preferences = {};
    let memory = {};
    try {
      preferences = JSON.parse(userSettingsDraft.preferences || '{}');
      memory = JSON.parse(userSettingsDraft.memory || '{}');
    } catch (error) {
      toast.error('Preferencias y memoria deben ser JSON valido');
      return;
    }
    setBusy('user-settings');
    try {
      await api.put(`/agent-studio/users/${selectedAgentUser.user.id}/settings`, {
        profile_id: selectedAgentUser.settings?.profile_id || selectedAgentUser.profile?.id,
        tools: userSettingsDraft.tools,
        preferences,
        memory,
        notes: userSettingsDraft.notes,
        is_active: userSettingsDraft.is_active,
      });
      toast.success('Configuracion de usuario guardada');
      await loadStudio();
    } catch (error) {
      toast.error(getErrorMessage(error, 'No pude guardar la configuracion del usuario'));
    } finally {
      setBusy('');
    }
  };

  const runTelegramE2ETest = async () => {
    if (!selectedAgentUser) return;
    setBusy('telegram-e2e');
    try {
      const response = await api.post('/agent-studio/telegram-e2e-test', {
        user_id: selectedAgentUser.user.id,
        message: 'crea una tarea de prueba E2E desde Agent Studio para validar Telegram y auditoria',
      });
      toast.success(`Prueba Telegram en cola: ${response.data?.update_id || 'queued'}`);
      await loadStudio();
    } catch (error) {
      toast.error(getErrorMessage(error, 'No pude ejecutar la prueba E2E de Telegram'));
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
                <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8">
                  <TabsTrigger value="prompts">Prompts</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="tools">Tools</TabsTrigger>
                  <TabsTrigger value="users">Usuarios</TabsTrigger>
                  <TabsTrigger value="audit">Auditoría</TabsTrigger>
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
                    <div className="rounded-lg border bg-muted/10 p-4">
                      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            value={skillSearch}
                            onChange={(event) => setSkillSearch(event.target.value)}
                            placeholder="Buscar skill, descripcion o categoria..."
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[
                            ['all', 'Todas'],
                            ['superpowers', 'Superpoderes'],
                            ['commercial', 'Skills comerciales'],
                          ].map(([value, label]) => (
                            <Button
                              key={value}
                              type="button"
                              variant={skillCategory === value ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSkillCategory(value)}
                            >
                              {label}
                            </Button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[
                            ['profile', 'Rol del perfil'],
                            ['agency_admin', 'Inmobiliaria'],
                            ['broker', 'Broker'],
                            ['rovi_admin', 'ROVI'],
                            ['copim_council', 'COPIM'],
                          ].map(([value, label]) => (
                            <Button
                              key={value}
                              type="button"
                              variant={skillRoleFilter === value ? 'secondary' : 'outline'}
                              size="sm"
                              onClick={() => setSkillRoleFilter(value)}
                            >
                              {label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch checked={showRecommendedOnly} onCheckedChange={setShowRecommendedOnly} />
                          Solo recomendadas
                        </label>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch checked={showEnabledOnly} onCheckedChange={setShowEnabledOnly} />
                          Solo activas
                        </label>
                        <Badge variant="outline">{filteredSkills.length} visibles</Badge>
                      </div>
                    </div>

                    {groupedSkills.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-8 text-center">
                        <Sparkles className="mx-auto mb-3 h-8 w-8 text-primary" />
                        <p className="text-sm font-medium">Sin resultados</p>
                        <p className="mt-1 text-xs text-muted-foreground">Ajusta busqueda o filtros para ver mas skills.</p>
                      </div>
                    ) : null}

                    {groupedSkills.map((section) => (
                      <section key={section.id} className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
                            <p className="text-xs text-muted-foreground">{section.description}</p>
                          </div>
                          <Badge variant="secondary">
                            {section.groups.reduce((total, [, skills]) => total + skills.length, 0)}
                          </Badge>
                        </div>

                        {section.groups.map(([groupName, skills]) => (
                          <div key={`${section.id}-${groupName}`} className="space-y-3 rounded-lg border p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h4 className="text-sm font-semibold text-foreground">{groupName}</h4>
                                {section.id === 'superpowers' ? (
                                  <p className="text-xs text-muted-foreground">
                                    Habilita entrada multimodal para interpretar informacion antes de mapearla al CRM.
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    Sugeridas segun rol, tenant y operacion del perfil.
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline">{skills.length}</Badge>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                              {skills.map((skill) => {
                                const checked = (form.enabled_skills || []).includes(skill.id);
                                const isSuperpower = skill.category === 'superpowers' || skill.is_superpower;
                                const isRecommended = activeSkillRole && (skill.recommended_roles || []).includes(activeSkillRole);
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
                                        {isSuperpower ? <UploadCloud className="h-4 w-4 shrink-0 text-primary" /> : <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                        <p className="truncate text-sm font-medium">{skill.label}</p>
                                      </div>
                                      {checked ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> : null}
                                    </div>
                                    <p className="line-clamp-3 text-xs text-muted-foreground">{skill.description}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {isRecommended ? <Badge variant="secondary">Recomendada</Badge> : null}
                                      {isSuperpower ? <Badge variant="outline">Superpoder</Badge> : null}
                                      {(skill.input_types || []).slice(0, 3).map((type) => (
                                        <Badge key={`${skill.id}-${type}`} variant="outline">{type}</Badge>
                                      ))}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
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

                <TabsContent value="users" className="mt-6 space-y-4">
                  <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
                    <div className="space-y-3">
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          <p className="text-sm font-medium">Usuarios del workspace</p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Cada usuario conserva memoria y permisos aislados por tenant, rol y perfil.
                        </p>
                      </div>
                      <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
                        {agentUsers.map((item) => (
                          <button
                            type="button"
                            key={item.user.id}
                            onClick={() => setSelectedUserId(item.user.id)}
                            className={`w-full rounded-lg border p-3 text-left transition-colors ${
                              selectedUserId === item.user.id ? 'border-primary/40 bg-primary/10' : 'hover:border-primary/30 hover:bg-primary/5'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{item.user.name || item.user.email}</p>
                                <p className="truncate text-xs text-muted-foreground">{item.user.email}</p>
                              </div>
                              {item.is_linked ? <Badge className="bg-emerald-500/10 text-emerald-700">Telegram</Badge> : <Badge variant="outline">Sin link</Badge>}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="secondary">{item.user.role}</Badge>
                              <Badge variant="outline">{item.role_scope}</Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedAgentUser ? (
                      <div className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="rounded-lg border p-4">
                            <UserCog className="mb-3 h-5 w-5 text-primary" />
                            <p className="text-sm font-medium">{selectedAgentUser.user.name || selectedAgentUser.user.email}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{selectedAgentUser.user.role} · {selectedAgentUser.role_scope}</p>
                          </div>
                          <div className="rounded-lg border p-4">
                            <Bot className="mb-3 h-5 w-5 text-primary" />
                            <p className="text-sm font-medium">{selectedAgentUser.profile?.name || 'Perfil base'}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{selectedAgentUser.profile?.hermes_profile_name || 'Hermes dinamico'}</p>
                          </div>
                          <div className="rounded-lg border p-4">
                            {selectedAgentUser.is_linked ? <Link2 className="mb-3 h-5 w-5 text-primary" /> : <KeyRound className="mb-3 h-5 w-5 text-muted-foreground" />}
                            <p className="text-sm font-medium">{selectedAgentUser.is_linked ? 'Telegram vinculado' : 'Sin Telegram'}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {selectedAgentUser.telegram_link?.activated_at
                                ? new Date(selectedAgentUser.telegram_link.activated_at).toLocaleString('es-MX')
                                : 'Genera QR en Agentes IA'}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-lg border p-4">
                          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-medium">Tools efectivas del usuario</p>
                              <p className="text-xs text-muted-foreground">Overrides por usuario. Si cambian, Telegram los usa en el siguiente mensaje.</p>
                            </div>
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Switch
                                checked={userSettingsDraft.is_active}
                                onCheckedChange={(checked) => setUserSettingsDraft((current) => ({ ...current, is_active: checked }))}
                              />
                              Runtime activo
                            </label>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            {toolCatalog.map((tool) => (
                              <div key={`user-${tool.id}`} className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                  <p className="text-sm font-medium">{tool.label}</p>
                                  <p className="text-xs text-muted-foreground">Scope individual</p>
                                </div>
                                <Switch checked={!!userSettingsDraft.tools?.[tool.id]} onCheckedChange={(checked) => toggleUserTool(tool.id, checked)} />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          <div>
                            <Label>Preferencias JSON</Label>
                            <Textarea
                              className="mt-2 min-h-52 font-mono text-xs"
                              value={userSettingsDraft.preferences}
                              onChange={(event) => setUserSettingsDraft((current) => ({ ...current, preferences: event.target.value }))}
                            />
                          </div>
                          <div>
                            <Label>Memoria aislada JSON</Label>
                            <Textarea
                              className="mt-2 min-h-52 font-mono text-xs"
                              value={userSettingsDraft.memory}
                              onChange={(event) => setUserSettingsDraft((current) => ({ ...current, memory: event.target.value }))}
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Notas internas</Label>
                          <Textarea
                            className="mt-2 min-h-20"
                            value={userSettingsDraft.notes}
                            onChange={(event) => setUserSettingsDraft((current) => ({ ...current, notes: event.target.value }))}
                            placeholder="Notas para el admin sobre este agente de usuario..."
                          />
                        </div>

                        <div className="flex justify-end">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button variant="outline" onClick={runTelegramE2ETest} disabled={busy === 'telegram-e2e' || !selectedAgentUser.is_linked}>
                              {busy === 'telegram-e2e' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                              Probar Telegram E2E
                            </Button>
                            <Button onClick={saveUserSettings} disabled={busy === 'user-settings'}>
                              {busy === 'user-settings' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                              Guardar usuario
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed p-8 text-center">
                        <Users className="mx-auto mb-3 h-8 w-8 text-primary" />
                        <p className="text-sm font-medium">Sin usuarios disponibles</p>
                        <p className="mt-1 text-xs text-muted-foreground">Cuando haya miembros activos apareceran aqui.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="audit" className="mt-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <History className="mb-3 h-5 w-5 text-primary" />
                      <p className="text-sm font-medium">Acciones ejecutadas</p>
                      <p className="mt-1 text-2xl font-semibold">{actionAudit.logs?.length || 0}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
                      <p className="text-sm font-medium">Previews recientes</p>
                      <p className="mt-1 text-2xl font-semibold">{actionAudit.pending_actions?.length || 0}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <MessageSquare className="mb-3 h-5 w-5 text-primary" />
                      <p className="text-sm font-medium">Webhook updates</p>
                      <p className="mt-1 text-2xl font-semibold">{actionAudit.webhook_updates?.length || 0}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border">
                    <div className="flex items-center justify-between border-b p-4">
                      <div>
                        <p className="text-sm font-medium">Auditoría de acciones del agente</p>
                        <p className="text-xs text-muted-foreground">Cambios confirmados o cancelados desde Telegram y Agent Studio.</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => void loadStudio()}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Actualizar
                      </Button>
                    </div>
                    <div className="divide-y">
                      {(actionAudit.logs || []).length === 0 ? (
                        <div className="p-8 text-center">
                          <History className="mx-auto mb-3 h-8 w-8 text-primary" />
                          <p className="text-sm font-medium">Sin acciones auditadas todavía</p>
                          <p className="mt-1 text-xs text-muted-foreground">Cuando un usuario confirme un cambio por Telegram aparecerá aquí.</p>
                        </div>
                      ) : (
                        (actionAudit.logs || []).map((log) => (
                          <div key={log.id} className="grid gap-3 p-4 lg:grid-cols-[180px_1fr_220px]">
                            <div>
                              <Badge variant={log.status === 'executed' ? 'default' : 'outline'}>{log.status}</Badge>
                              <p className="mt-2 text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString('es-MX')}</p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{log.action_type}</p>
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{log.requested_text || 'Sin texto fuente'}</p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <p>Rol: {log.role_scope || 'n/a'}</p>
                              <p>Registros: {(log.result?.record_ids || []).join(', ') || 'n/a'}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm font-medium">Previews pendientes/recientes</p>
                      <div className="mt-3 space-y-2">
                        {(actionAudit.pending_actions || []).slice(0, 8).map((item) => (
                          <div key={item.id} className="rounded-lg border p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium">{item.type}</p>
                              <Badge variant="outline">{item.status}</Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString('es-MX')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm font-medium">Webhook Telegram</p>
                      <div className="mt-3 space-y-2">
                        {(actionAudit.webhook_updates || []).slice(0, 8).map((item) => (
                          <div key={item.id} className="rounded-lg border p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-medium">{item.message_preview || item.id}</p>
                              <Badge variant={item.status === 'processed' ? 'default' : 'outline'}>{item.status}</Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{item.created_at ? new Date(item.created_at).toLocaleString('es-MX') : 'sin fecha'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
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
                          accept=".txt,.md,.csv,.json,.html,.xml,.xlsx,.xls,.pdf,.jpg,.jpeg,.png,.webp,.gif,.heic,.mp3,.m4a,.ogg,.wav,.aac,.mp4,.mov,.webm,.mkv"
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
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                    <p className="text-sm font-medium text-amber-800">Aplicacion en Hermes</p>
                    <p className="mt-1 text-sm text-amber-800/80">
                      Sincronizar actualiza SOUL.md, profile.yaml y rovi_agent_studio_profile.json con las skills activas.
                      Si el gateway ya tenia este perfil cargado, reinicia Hermes Agent para asegurar que lea la version nueva.
                    </p>
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
