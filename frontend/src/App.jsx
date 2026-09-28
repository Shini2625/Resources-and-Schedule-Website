import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  FileText,
  FolderOpen,
  GraduationCap,
  Globe,
  LayoutDashboard,
  Link2,
  LoaderCircle,
  Lock,
  LogOut,
  Menu,
  Plus,
  Quote,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  UploadCloud,
  UserRound,
  X,
} from 'lucide-react';
import { apiRequest } from './lib/api';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'courses', label: 'My courses', icon: BookOpen },
  { id: 'shared', label: 'Shared library', icon: Globe },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'tasks', label: 'Tasks & deadlines', icon: CheckCircle2 },
  { id: 'motivation', label: 'Motivation', icon: Quote },
];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CATEGORIES = ['notes', 'references', 'tutorials', 'solutions', 'pyqs', 'grading', 'custom', 'slides'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const asArray = (value) => (Array.isArray(value) ? value : []);
const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'S';
const todayName = () => new Intl.DateTimeFormat('en', { weekday: 'long' }).format(new Date());
const prettyDate = (date = new Date()) => new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
const shortDate = (value) => {
  if (!value) return 'No due date';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
};
const prettyTime = (value = '') => {
  const [hours, minutes] = value.split(':');
  if (hours === undefined || minutes === undefined) return value;
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(date);
};
const sortByTime = (items) => [...items].sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken') || '');
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [todos, setTodos] = useState([]);
  const [motivations, setMotivations] = useState([]);
  const [activeMotivation, setActiveMotivation] = useState(null);
  const [storageConfigured, setStorageConfigured] = useState(false);
  const [storageChecked, setStorageChecked] = useState(false);
  const [ready, setReady] = useState(() => !localStorage.getItem('accessToken'));
  const [screenError, setScreenError] = useState('');
  const [toast, setToast] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const changeToken = useCallback((nextToken) => {
    if (nextToken) {
      localStorage.setItem('accessToken', nextToken);
      setToken(nextToken);
    } else {
      localStorage.removeItem('accessToken');
      setToken('');
    }
  }, []);

  const notify = useCallback((message, kind = 'success') => {
    setToast({ message, kind, id: Date.now() });
  }, []);

  const loadData = useCallback(async (activeToken) => {
    const options = { token: activeToken, onTokenChange: changeToken };
    const [courseData, scheduleData, todoData, motivationData, activeData, storageData] = await Promise.all([
      apiRequest('/courses', options),
      apiRequest('/timetable', options),
      apiRequest('/todos', options),
      apiRequest('/motivation', options),
      apiRequest('/motivation/active', options),
      apiRequest('/upload/config', options),
    ]);
    setCourses(asArray(courseData));
    setSchedule(asArray(scheduleData));
    setTodos(asArray(todoData));
    setMotivations(asArray(motivationData));
    setActiveMotivation(activeData);
    setStorageConfigured(storageData?.configured === true);
    setStorageChecked(true);
  }, [changeToken]);

  useEffect(() => {
    let alive = true;
    if (!token) {
      return () => { alive = false; };
    }
    (async () => {
      try {
        const profile = await apiRequest('/auth/me', { token, onTokenChange: changeToken });
        if (!alive) return;
        setUser(profile);
        await loadData(token);
      } catch (error) {
        if (!alive) return;
        if (error.status === 401) {
          changeToken('');
          setUser(null);
        } else {
          setScreenError(error.message || 'Could not load your study space.');
        }
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => { alive = false; };
  }, [token, changeToken, loadData]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const reload = useCallback(async () => {
    await loadData(token);
  }, [loadData, token]);

  const handleLogin = async (identifier, password, mode, fullName, username) => {
    const body = mode === 'register'
      ? { fullName, username, email: identifier, password }
      : { email: identifier, username: identifier, password };
    const result = await apiRequest(mode === 'register' ? '/auth/register' : '/auth/login', {
      method: 'POST', body, auth: false,
    });
    if (!result?.token) throw new Error('The server did not return an access token.');
    changeToken(result.token);
    setUser(result.user || null);
    setPage('dashboard');
    notify(mode === 'register' ? 'Your study space is ready.' : 'Welcome back.');
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST', token, onTokenChange: changeToken });
    } catch {
      // Clear the local session even if the network is unavailable.
    }
    changeToken('');
    setUser(null);
    setPage('dashboard');
    notify('You have been signed out.');
  };

  const toggleTodo = async (item) => {
    try {
      await apiRequest(`/todos/${item.id}/toggle`, { method: 'PATCH', body: {}, token, onTokenChange: changeToken });
      await reload();
    } catch (error) {
      notify(error.message || 'Could not update this task.', 'error');
    }
  };

  const navigate = (nextPage) => {
    setPage(nextPage);
    setMobileNavOpen(false);
  };

  if (!ready) return <LoadingScreen label="Opening your study space…" />;
  if (!token) return <AuthScreen onSubmit={handleLogin} />;
  if (!user && screenError) return <RetryScreen message={screenError} onRetry={() => window.location.reload()} onLogout={handleLogout} />;
  if (!user) return <LoadingScreen label="Getting your workspace ready…" />;

  return (
    <div className="app-shell">
      {mobileNavOpen && <button className="nav-scrim" aria-label="Close menu" onClick={() => setMobileNavOpen(false)} />}
      <Sidebar page={page} onNavigate={navigate} user={user} onLogout={handleLogout} mobileOpen={mobileNavOpen} />
      <div className="main-column">
        <Topbar user={user} onMenu={() => setMobileNavOpen((open) => !open)} courses={courses} todos={todos} schedule={schedule} onNavigate={navigate} />
        <main className="page-content">
          {page === 'dashboard' && (
            <DashboardPage
              user={user} courses={courses} schedule={schedule} todos={todos} activeMotivation={activeMotivation}
              onNavigate={navigate} onToggleTodo={toggleTodo} storageConfigured={storageConfigured}
            />
          )}
          {page === 'courses' && <CoursesPage courses={courses} token={token} onTokenChange={changeToken} onReload={reload} notify={notify} storageConfigured={storageConfigured} storageChecked={storageChecked} />}
          {page === 'shared' && <SharedLibraryPage token={token} onTokenChange={changeToken} />}
          {page === 'schedule' && <SchedulePage schedule={schedule} courses={courses} token={token} onTokenChange={changeToken} onReload={reload} notify={notify} />}
          {page === 'tasks' && <TasksPage todos={todos} courses={courses} token={token} onTokenChange={changeToken} onReload={reload} onToggle={toggleTodo} notify={notify} />}
          {page === 'motivation' && <MotivationPage motivations={motivations} token={token} onTokenChange={changeToken} onReload={reload} notify={notify} />}
          {page === 'profile' && <ProfilePage user={user} token={token} onTokenChange={changeToken} onUser={setUser} notify={notify} onLogout={handleLogout} />}
        </main>
      </div>
      {toast && <div className={`toast toast-${toast.kind}`} role="status"><span className="toast-mark">{toast.kind === 'error' ? <X size={16} /> : <Check size={16} />}</span>{toast.message}</div>}
    </div>
  );
}

function LoadingScreen({ label }) {
  return <div className="loading-screen"><div className="loading-mark"><GraduationCap size={25} /></div><LoaderCircle className="spin" size={19} /><span>{label}</span></div>;
}

function RetryScreen({ message, onRetry, onLogout }) {
  return <div className="loading-screen"><div className="retry-card"><div className="brand-mark"><GraduationCap size={25} /></div><h1>We couldn’t reach your workspace</h1><p>{message}</p><div className="button-row centered"><button className="button button-primary" onClick={onRetry}>Try again</button><button className="button button-quiet" onClick={onLogout}>Sign out</button></div></div></div>;
}

function AuthScreen({ onSubmit }) {
  const [mode, setMode] = useState('login');
  const [fields, setFields] = useState({ fullName: '', username: '', identifier: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const update = (event) => setFields((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    try { await onSubmit(fields.identifier.trim(), fields.password, mode, fields.fullName.trim(), fields.username.trim()); }
    catch (reason) { setError(reason.message || 'Please try again.'); }
    finally { setBusy(false); }
  };
  return (
    <div className="auth-page">
      <div className="auth-decoration auth-decoration-one" /><div className="auth-decoration auth-decoration-two" />
      <section className="auth-card">
        <div className="auth-brand"><div className="brand-mark"><GraduationCap size={26} /></div><span>JACKER <i>STUDY SPACE</i></span></div>
        <div className="auth-copy"><span className="eyebrow">A quieter way to get it done</span><h1>{mode === 'login' ? 'Welcome back.' : 'Make room to grow.'}</h1><p>Keep your classes, resources and small wins in one thoughtful place.</p></div>
        <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign in</button><button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>Create account</button></div>
        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && <label>Your name<input name="fullName" value={fields.fullName} onChange={update} placeholder="Alex Morgan" required autoComplete="name" /></label>}
          {mode === 'register' && <label>Username <span className="field-hint">optional</span><input name="username" value={fields.username} onChange={update} placeholder="alexmorgan" autoComplete="username" /></label>}
          <label>{mode === 'login' ? 'Email or username' : 'Email address'}<input name="identifier" value={fields.identifier} onChange={update} placeholder={mode === 'login' ? 'you@example.com or username' : 'you@example.com'} required autoComplete={mode === 'login' ? 'username' : 'email'} type={mode === 'register' ? 'email' : 'text'} /></label>
          <label>Password<input name="password" value={fields.password} onChange={update} placeholder="At least 6 characters" required minLength={mode === 'register' ? 6 : undefined} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
          {error && <div className="inline-alert alert-error" role="alert">{error}</div>}
          <button className="button button-primary auth-submit" disabled={busy}>{busy ? <><LoaderCircle className="spin" size={17} /> One moment…</> : <>{mode === 'login' ? 'Sign in to your space' : 'Create my space'} <ArrowRight size={17} /></>}</button>
        </form>
        <p className="auth-footnote"><Sparkles size={14} /> Made for steady progress, not perfect plans.</p>
      </section>
      <aside className="auth-side-note"><span>01 — MAKE A PLAN</span><span>02 — KEEP SHOWING UP</span><span>03 — NOTICE THE PROGRESS</span></aside>
    </div>
  );
}

function Sidebar({ page, onNavigate, user, onLogout, mobileOpen }) {
  return (
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <button className="sidebar-brand" onClick={() => onNavigate('dashboard')} aria-label="Jacker overview"><span className="brand-mark"><GraduationCap size={22} /></span><span className="brand-word">Jacker<small>STUDY SPACE</small></span></button>
      <div className="workspace-label">YOUR WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${page === id ? 'nav-active' : ''}`} onClick={() => onNavigate(id)}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{id === 'tasks' && <span className="nav-count">›</span>}</button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-quote"><span className="quote-glyph">“</span><p>Small steps every day add up to big change.</p><span className="quote-byline">A NOTE TO SELF</span></div>
        <button className={`nav-item ${page === 'profile' ? 'nav-active' : ''}`} onClick={() => onNavigate('profile')}><Settings2 size={18} strokeWidth={1.8} /><span>Profile & settings</span></button>
        <div className="sidebar-user"><span className="avatar avatar-small">{initials(user.fullName)}</span><span className="sidebar-user-copy"><strong>{user.fullName || 'Student'}</strong><small>{user.email}</small></span><button className="icon-button logout-button" onClick={onLogout} aria-label="Sign out" title="Sign out"><LogOut size={16} /></button></div>
      </div>
    </aside>
  );
}

function Topbar({ user, onMenu, courses, todos, schedule, onNavigate }) {
  const [query, setQuery] = useState('');
  const searchInput = useRef(null);
  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    const entries = [
      ...courses.map((item) => ({ kind: 'Course', title: item.title, detail: item.code, page: 'courses' })),
      ...todos.map((item) => ({ kind: 'Task', title: item.title, detail: item.completed ? 'Completed' : item.priority || 'To do', page: 'tasks' })),
      ...schedule.map((item) => ({ kind: 'Schedule', title: item.title, detail: `${item.dayOfWeek} · ${prettyTime(item.startTime)}`, page: 'schedule' })),
    ];
    return entries.filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(value)).slice(0, 6);
  }, [query, courses, todos, schedule]);
  useEffect(() => {
    const focusSearch = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInput.current?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);
  return (
    <header className="topbar">
      <button className="mobile-menu icon-button" onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button>
      <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>Today</strong></div>
      <div className="topbar-actions"><div className="topbar-search"><label className="search-box"><Search size={16} /><input ref={searchInput} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your space" aria-label="Search your space" /><kbd>⌘ K</kbd></label>{query.trim() && <div className="search-dropdown" role="listbox">{results.length ? results.map((item, index) => { const Icon = item.kind === 'Course' ? BookOpen : item.kind === 'Task' ? CheckCircle2 : CalendarDays; return <button key={`${item.kind}-${item.title}-${index}`} onClick={() => { onNavigate(item.page); setQuery(''); }}><span className="search-result-icon"><Icon size={14} /></span><span><strong>{item.title}</strong><small>{item.kind} · {item.detail}</small></span><ArrowUpRight size={14} /></button>; }) : <p>No matches in your workspace.</p>}</div>}</div><span className="topbar-divider" /><div className="topbar-date">{prettyDate()}</div><span className="avatar avatar-top" title={user.fullName}>{initials(user.fullName)}</span></div>
    </header>
  );
}

function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action && <div className="heading-action">{action}</div>}</div>;
}

function DashboardPage({ user, courses, schedule, todos, activeMotivation, onNavigate, onToggleTodo, storageConfigured }) {
  const today = todayName();
  const todaysSchedule = sortByTime(schedule.filter((item) => item.dayOfWeek === today));
  const openTodos = todos.filter((item) => !item.completed);
  const dueSoon = [...openTodos].sort((a, b) => String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999'))).slice(0, 4);
  const currentCourses = courses.filter((item) => item.status !== 'completed').slice(0, 4);
  return (
    <>
      <PageHeading eyebrow={prettyDate()} title={`Good to see you, ${user.fullName?.split(' ')[0] || 'there'}.`} subtitle="A little focus today can make tomorrow feel lighter." action={<button className="button button-primary" onClick={() => onNavigate('tasks')}><Plus size={17} /> Add a task</button>} />
      <section className="panel note-panel dashboard-note">
        <div className="dashboard-note-head">
          <span className="note-icon"><Quote size={18} /></span>
          <span><span className="note-caption">A MOMENT FOR YOU</span><span className="eyebrow">A NOTE TO SELF</span></span>
        </div>
        <blockquote>{activeMotivation?.quote || '“Success is the sum of small efforts, repeated day in and day out.”'}</blockquote>
        <button className="text-link" onClick={() => onNavigate('motivation')}>Your motivation space <ArrowRight size={14} /></button>
      </section>
      <section className="welcome-banner">
        <div className="welcome-copy"><span className="banner-kicker"><Sparkles size={14} /> YOUR DAILY REMINDER</span><h2>{activeMotivation?.quote || 'Keep showing up for the work that matters.'}</h2><p>Your pace is allowed to be your own. Start where you are.</p><button className="banner-link" onClick={() => onNavigate('motivation')}>Visit your motivation space <ArrowRight size={15} /></button></div>
        <div className="banner-art" aria-hidden="true"><div className="sun-disc" /><div className="art-leaf leaf-one" /><div className="art-leaf leaf-two" /><div className="art-leaf leaf-three" /><div className="art-line art-line-one" /><div className="art-line art-line-two" /><span className="art-orbit" /></div>
      </section>
      {!storageConfigured && <div className="storage-note"><UploadCloud size={17} /><span><strong>File uploads are paused.</strong> Add the R2 settings to the backend service on Render to enable direct uploads.</span><button onClick={() => onNavigate('courses')}>Manage resources <ArrowRight size={14} /></button></div>}
      <section className="stats-grid">
        <StatCard icon={BookOpen} label="Active courses" value={courses.filter((item) => item.status !== 'completed').length} foot={`${courses.length} in your library`} accent="green" />
        <StatCard icon={CheckCircle2} label="Open tasks" value={openTodos.length} foot={openTodos.length ? `${todos.filter((item) => item.completed).length} completed so far` : 'A clear list is a lovely thing'} accent="gold" />
        <StatCard icon={CalendarDays} label="Today’s classes" value={todaysSchedule.length} foot={todaysSchedule.length ? `${prettyTime(todaysSchedule[0].startTime)} is next up` : 'No classes on the calendar'} accent="lavender" />
        <StatCard icon={FolderOpen} label="Saved resources" value={courses.reduce((sum, course) => sum + (course.resources?.length || 0), 0)} foot="Notes, links & course files" accent="rose" />
      </section>
      <section className="dashboard-grid">
        <div className="panel schedule-panel">
          <div className="panel-heading"><div><span className="eyebrow">ON THE CALENDAR</span><h2>Today’s rhythm</h2></div><button className="text-link" onClick={() => onNavigate('schedule')}>Full schedule <ArrowRight size={14} /></button></div>
          {todaysSchedule.length ? <div className="timeline-list">{todaysSchedule.slice(0, 4).map((item) => <div className="timeline-item" key={item.id}><div className="time-col"><strong>{prettyTime(item.startTime)}</strong><span>{prettyTime(item.endTime)}</span></div><span className="timeline-dot" /><div className="timeline-content"><strong>{item.title}</strong><span>{item.course?.code || item.location || 'Study block'}{item.location && item.course?.code ? ` · ${item.location}` : ''}</span></div></div>)}</div> : <EmptyState icon={CalendarDays} title="Nothing scheduled today" body="Add a class or focus block to give the day some shape." action={<button className="button button-outline button-small" onClick={() => onNavigate('schedule')}><Plus size={15} /> Add to schedule</button>} />}
        </div>
        <div className="panel tasks-panel">
          <div className="panel-heading"><div><span className="eyebrow">ONE STEP AT A TIME</span><h2>Coming up</h2></div><button className="text-link" onClick={() => onNavigate('tasks')}>All tasks <ArrowRight size={14} /></button></div>
          {dueSoon.length ? <div className="task-list">{dueSoon.map((item) => <TaskRow key={item.id} item={item} onToggle={onToggleTodo} compact />)}</div> : <EmptyState icon={CheckCircle2} title="You’re all caught up" body="Add a task whenever something new lands on your plate." action={<button className="button button-outline button-small" onClick={() => onNavigate('tasks')}><Plus size={15} /> Add a task</button>} />}
        </div>
        <div className="panel courses-panel">
          <div className="panel-heading"><div><span className="eyebrow">YOUR LEARNING</span><h2>Current courses</h2></div><button className="text-link" onClick={() => onNavigate('courses')}>See courses <ArrowRight size={14} /></button></div>
          {currentCourses.length ? <div className="course-mini-grid">{currentCourses.map((course, index) => <button className={`course-mini course-tone-${index % 4}`} key={course.id} onClick={() => onNavigate('courses')}><span className="course-mini-icon"><BookOpen size={17} /></span><span><strong>{course.title}</strong><small>{course.code} · Year {course.year}</small></span><ChevronRight size={16} /></button>)}</div> : <EmptyState icon={BookOpen} title="Start your course library" body="Create a course, then keep all its resources together." action={<button className="button button-outline button-small" onClick={() => onNavigate('courses')}><Plus size={15} /> Add a course</button>} />}
        </div>
      </section>
    </>
  );
}

function StatCard({ icon: Icon, label, value, foot, accent }) {
  return <article className={`stat-card stat-${accent}`}><span className="stat-icon"><Icon size={19} strokeWidth={1.8} /></span><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-foot">{foot}</span></article>;
}

function EmptyState({ icon: Icon, title, body, action }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={20} /></span><strong>{title}</strong><p>{body}</p>{action}</div>;
}

function CoursesPage({ courses, token, onTokenChange, onReload, notify, storageConfigured, storageChecked }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resourceFormOpen, setResourceFormOpen] = useState(false);
  const [resourceType, setResourceType] = useState('link');
  const [resources, setResources] = useState([]);
  const activeId = selectedId ?? courses[0]?.id ?? null;
  const [resourcesCourseId, setResourcesCourseId] = useState(null);
  const resourceLoading = Boolean(activeId && String(resourcesCourseId) !== String(activeId));
  const [resourceSaving, setResourceSaving] = useState(false);
  const selected = courses.find((item) => String(item.id) === String(activeId));
  const filtered = useMemo(() => courses.filter((course) => `${course.title} ${course.code}`.toLowerCase().includes(search.toLowerCase())), [courses, search]);
  useEffect(() => {
    let active = true;
    if (!activeId) return () => { active = false; };
    apiRequest(`/resources/course/${activeId}`, { token, onTokenChange })
      .then((data) => { if (active) { setResources(asArray(data)); setResourcesCourseId(activeId); } })
      .catch((error) => { if (active) { setResources([]); setResourcesCourseId(activeId); notify(error.message || 'Could not load resources.', 'error'); } });
    return () => { active = false; };
  }, [activeId, token, onTokenChange, notify]);

  const submitCourse = async (event) => {
    event.preventDefault(); setSaving(true);
    const form = new FormData(event.currentTarget);
    const body = { title: form.get('title'), code: form.get('code'), year: Number(form.get('year') || 1), semester: form.get('semester'), status: form.get('status'), description: form.get('description') || undefined };
    try {
      const result = await apiRequest(editing ? `/courses/${editing.id}` : '/courses', { method: editing ? 'PATCH' : 'POST', body, token, onTokenChange });
      await onReload(); setSelectedId(result.id); setFormOpen(false); setEditing(null); notify(editing ? 'Course updated.' : 'Course added to your library.');
    } catch (error) { notify(error.message || 'Could not save course.', 'error'); }
    finally { setSaving(false); }
  };
  const deleteCourse = async (course) => {
    if (!window.confirm(`Delete ${course.title} and its saved resources?`)) return;
    try { await apiRequest(`/courses/${course.id}`, { method: 'DELETE', token, onTokenChange }); await onReload(); if (String(selectedId) === String(course.id)) setSelectedId(null); notify('Course removed.'); }
    catch (error) { notify(error.message || 'Could not delete course.', 'error'); }
  };
  const submitResource = async (event) => {
    event.preventDefault(); setResourceSaving(true);
    const form = new FormData(event.currentTarget);
    const title = form.get('title'); const type = form.get('type'); const file = form.get('file');
    const body = { title, category: form.get('category'), type, description: form.get('description') || undefined, isPublic: form.get('isPublic') === 'true' };
    try {
      if (type === 'link') body.externalLink = form.get('externalLink');
      if (type === 'file') {
        if (!(file instanceof File) || !file.size) throw new Error('Choose a file to upload.');
        const signed = await apiRequest('/upload/presigned-url', { method: 'POST', body: { fileName: file.name, fileType: file.type || 'application/octet-stream', folder: 'resources' }, token, onTokenChange });
        if (!signed?.configured || !signed.uploadUrl) throw new Error(signed?.message || 'Cloudflare R2 is not configured on the backend yet.');
        let upload;
        try { upload = await fetch(signed.uploadUrl, { method: signed.method || 'PUT', headers: signed.headers || { 'Content-Type': file.type }, body: file }); }
        catch { throw new Error('The file could not reach R2. Check the bucket CORS rules for this website and allow PUT.'); }
        if (!upload.ok) throw new Error(`R2 rejected the file upload (HTTP ${upload.status}). Check the bucket CORS policy and access key permissions.`);
        body.fileUrl = signed.fileUrl;
      }
      const created = await apiRequest(`/resources/course/${activeId}`, { method: 'POST', body, token, onTokenChange });
      setResources((previous) => [created, ...previous]); setResourcesCourseId(activeId); setResourceFormOpen(false); await onReload(); notify('Resource saved to this course.');
    } catch (error) { notify(error.message || 'Could not save resource.', 'error'); }
    finally { setResourceSaving(false); }
  };
  const deleteResource = async (resource) => {
    if (!window.confirm(`Remove “${resource.title}” from this course?`)) return;
    try { await apiRequest(`/resources/${resource.id}`, { method: 'DELETE', token, onTokenChange }); setResources((previous) => previous.filter((item) => item.id !== resource.id)); await onReload(); notify('Resource removed.'); }
    catch (error) { notify(error.message || 'Could not remove resource.', 'error'); }
  };
  const updateResourceVisibility = async (resource) => {
    const isPublic = !resource.isPublic;
    try {
      await apiRequest(`/resources/${resource.id}`, { method: 'PATCH', body: { isPublic }, token, onTokenChange });
      setResources((previous) => previous.map((item) => item.id === resource.id ? { ...item, isPublic } : item));
      await onReload();
      notify(isPublic ? 'Shared with all signed-in Jacker users.' : 'This resource is private again.');
    } catch (error) { notify(error.message || 'Could not change resource visibility.', 'error'); }
  };

  return (
    <>
      <PageHeading eyebrow="YOUR LEARNING LIBRARY" title="My courses" subtitle="Keep class notes, helpful links and course files close at hand." action={<button className="button button-primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={17} /> Add a course</button>} />
      <div className="courses-toolbar"><label className="search-box course-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a course" /></label><span className="result-count">{filtered.length} {filtered.length === 1 ? 'course' : 'courses'}</span></div>
      {storageChecked && !storageConfigured && <div className="storage-note storage-note-page"><UploadCloud size={17} /><span><strong>File uploads are not available yet.</strong> Render still reports missing R2 settings. You can save text and link resources in the meantime.</span></div>}
      {courses.length === 0 ? <div className="panel page-empty-panel"><EmptyState icon={BookOpen} title="Your library starts here" body="Add your first course, then give its resources a home." action={<button className="button button-primary" onClick={() => setFormOpen(true)}><Plus size={16} /> Add your first course</button>} /></div> : (
        <div className="courses-layout">
          <section className="course-list-area"><div className="course-card-grid">{filtered.map((course, index) => <article className={`course-card course-card-${index % 4} ${String(selectedId) === String(course.id) ? 'course-selected' : ''}`} key={course.id}>
            <button className="course-card-main" onClick={() => setSelectedId(course.id)}><span className="course-card-top"><span className="course-code">{course.code}</span><span className={`status-pill ${course.status === 'completed' ? 'status-completed' : ''}`}>{course.status || 'active'}</span></span><strong>{course.title}</strong><span className="course-meta">Year {course.year} <i /> {course.semester}</span><span className="course-resource-count"><FolderOpen size={14} /> {course.resources?.length || 0} resources</span></button>
            <div className="course-card-actions"><button className="icon-button" aria-label={`Edit ${course.title}`} onClick={() => { setEditing(course); setFormOpen(true); }}><Settings2 size={15} /></button><button className="icon-button danger-hover" aria-label={`Delete ${course.title}`} onClick={() => deleteCourse(course)}><Trash2 size={15} /></button></div>
          </article>)}</div></section>
          <aside className="panel resource-panel">
            {selected ? <><div className="resource-panel-head"><div><span className="eyebrow">COURSE RESOURCES</span><h2>{selected.title}</h2><p>{selected.code} · Year {selected.year} · {selected.semester}</p></div><button className="icon-button close-detail" onClick={() => setSelectedId(null)} aria-label="Close course details"><X size={17} /></button></div>
              {selected.description && <p className="course-description">{selected.description}</p>}
              <div className="resource-heading"><h3>Saved for this class</h3><button className="button button-outline button-small" onClick={() => { setResourceType('link'); setResourceFormOpen(true); }}><Plus size={15} /> Add resource</button></div>
              {resourceLoading ? <div className="panel-loading"><LoaderCircle className="spin" size={18} /> Loading resources…</div> : resources.length ? <div className="resource-list">{resources.map((resource) => <div className="resource-row" key={resource.id}><span className="resource-type-icon">{resource.type === 'link' ? <Link2 size={16} /> : <FileText size={16} />}</span><span className="resource-row-copy"><strong>{resource.title}</strong><small>{resource.category}{resource.description ? ` · ${resource.description}` : ''}</small></span><span className={`visibility-pill ${resource.isPublic ? 'visibility-public' : 'visibility-private'}`}>{resource.isPublic ? <Globe size={12} /> : <Lock size={12} />}{resource.isPublic ? 'Shared' : 'Private'}</span>{(resource.fileUrl || resource.externalLink) && <a href={resource.externalLink || resource.fileUrl} target="_blank" rel="noreferrer" className="icon-button" aria-label={`Open ${resource.title}`}><ArrowUpRight size={16} /></a>}<button className="icon-button visibility-toggle" aria-label={resource.isPublic ? `Make ${resource.title} private` : `Share ${resource.title} with Jacker users`} title={resource.isPublic ? 'Make private' : 'Share with Jacker users'} onClick={() => updateResourceVisibility(resource)}>{resource.isPublic ? <Lock size={15} /> : <Globe size={15} />}</button><button className="icon-button danger-hover" aria-label={`Delete ${resource.title}`} onClick={() => deleteResource(resource)}><Trash2 size={15} /></button></div>)}</div> : <EmptyState icon={FileText} title="No resources yet" body="Add notes, a useful link or an uploaded class file." action={<button className="button button-outline button-small" onClick={() => setResourceFormOpen(true)}><Plus size={15} /> Add resource</button>} />}
            </> : <div className="resource-placeholder"><span className="empty-icon"><FolderOpen size={20} /></span><strong>Choose a course</strong><p>Select a course card to browse its notes, links and files.</p></div>}
          </aside>
        </div>
      )}
      {formOpen && <Modal title={editing ? 'Edit course' : 'Add a course'} subtitle="A little context helps keep your study space organized." onClose={() => setFormOpen(false)}><form className="form-stack" onSubmit={submitCourse}><div className="form-grid"><label>Course name<input name="title" defaultValue={editing?.title || ''} placeholder="Introduction to Biology" required /></label><label>Course code<input name="code" defaultValue={editing?.code || ''} placeholder="BIO 101" required /></label><label>Year<input name="year" type="number" min="1" max="10" defaultValue={editing?.year || 1} required /></label><label>Semester<input name="semester" defaultValue={editing?.semester || 'Semester 1'} required /></label><label>Status<select name="status" defaultValue={editing?.status || 'active'}><option value="active">Active</option><option value="completed">Completed</option></select></label></div><label>Description <span className="field-hint">optional</span><textarea name="description" defaultValue={editing?.description || ''} rows="3" placeholder="What are you working toward in this course?" /></label><div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setFormOpen(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add course'}</button></div></form></Modal>}
      {resourceFormOpen && selected && <Modal title="Add a resource" subtitle={`Save something useful for ${selected.code}.`} onClose={() => setResourceFormOpen(false)}><form className="form-stack" onSubmit={submitResource}><div className="form-grid"><label>Title<input name="title" required placeholder="Lecture notes — Week 4" /></label><label>Category<select name="category" defaultValue="notes">{CATEGORIES.map((item) => <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>)}</select></label><label>Resource type<select name="type" value={resourceType} onChange={(event) => setResourceType(event.target.value)}><option value="link">Web link</option><option value="text">Text note</option><option value="file">File upload (R2)</option></select></label>{resourceType === 'link' && <label>Link URL<input name="externalLink" type="url" placeholder="https://…" required /></label>}{resourceType === 'file' && <label>Choose file<input name="file" type="file" required /></label>}<label className="visibility-choice">Visibility<select name="isPublic" defaultValue="false"><option value="false">Private — only you</option><option value="true">Public — all signed-in Jacker users</option></select><span className="field-hint">Public resources appear in the Shared Library. Private resources stay in your account.</span></label></div><label>Description / note<textarea name="description" rows="3" placeholder="A quick reminder about what this is for…" /></label><div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setResourceFormOpen(false)}>Cancel</button><button className="button button-primary" disabled={resourceSaving}>{resourceSaving ? <><LoaderCircle className="spin" size={16} /> Saving…</> : 'Save resource'}</button></div></form></Modal>}
    </>
  );
}

function SharedLibraryPage({ token, onTokenChange }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    let active = true;
    apiRequest('/resources/public', { token, onTokenChange })
      .then((data) => { if (active) setResources(asArray(data)); })
      .catch((reason) => { if (active) setError(reason.message || 'Could not load shared resources.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, onTokenChange]);
  const filtered = useMemo(() => resources.filter((item) => `${item.title} ${item.category} ${item.course?.title || ''} ${item.course?.code || ''}`.toLowerCase().includes(search.toLowerCase())), [resources, search]);
  return <>
    <PageHeading eyebrow="SHARED WITH JACKER" title="Shared library" subtitle="Browse resources that Jacker users have chosen to share." />
    <div className="shared-library-note"><Globe size={17} /><span>Only public resources appear here. Private resources remain visible only to their owners.</span></div>
    <div className="courses-toolbar"><label className="search-box course-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shared resources" /></label><span className="result-count">{filtered.length} {filtered.length === 1 ? 'resource' : 'resources'}</span></div>
    {error ? <div className="inline-alert alert-error" role="alert">{error}</div> : loading ? <div className="panel-loading"><LoaderCircle className="spin" size={18} /> Loading shared resources…</div> : filtered.length ? <div className="public-resource-grid">{filtered.map((resource) => {
      const target = resource.externalLink || resource.fileUrl;
      const safeTarget = target && /^https?:\/\//i.test(target) ? target : null;
      return <article className="panel public-resource-card" key={resource.id}><div className="public-resource-top"><span className="resource-type-icon">{resource.type === 'link' ? <Link2 size={16} /> : <FileText size={16} />}</span><span className="visibility-pill visibility-public"><Globe size={12} /> Public</span></div><span className="eyebrow">{resource.category}</span><h2>{resource.title}</h2><p className="public-resource-course">{resource.course?.code ? `${resource.course.code} · ` : ''}{resource.course?.title || 'Shared resource'}</p>{resource.description && <p className="public-resource-description">{resource.description}</p>}{safeTarget ? <a href={safeTarget} target="_blank" rel="noreferrer" className="button button-outline button-small">Open resource <ArrowUpRight size={14} /></a> : <span className="public-resource-note">Shared with Jacker users</span>}</article>;
    })}</div> : <div className="panel page-empty-panel"><EmptyState icon={Globe} title="Nothing shared yet" body="When Jacker users choose to share a resource, it will appear here." /></div>}
  </>;
}

function SchedulePage({ schedule, courses, token, onTokenChange, onReload, notify }) {
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const grouped = DAYS.map((day) => ({ day, items: sortByTime(schedule.filter((item) => item.dayOfWeek === day)) })).filter((group) => group.items.length);
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); const form = new FormData(event.currentTarget);
    try { await apiRequest('/timetable', { method: 'POST', token, onTokenChange, body: { title: form.get('title'), dayOfWeek: form.get('dayOfWeek'), startTime: form.get('startTime'), endTime: form.get('endTime'), location: form.get('location') || undefined, notes: form.get('notes') || undefined, courseId: form.get('courseId') ? Number(form.get('courseId')) : null } }); await onReload(); setFormOpen(false); notify('Added to your schedule.'); }
    catch (error) { notify(error.message || 'Could not add this event.', 'error'); } finally { setSaving(false); }
  };
  const remove = async (item) => { if (!window.confirm(`Remove “${item.title}” from your schedule?`)) return; try { await apiRequest(`/timetable/${item.id}`, { method: 'DELETE', token, onTokenChange }); await onReload(); notify('Schedule item removed.'); } catch (error) { notify(error.message || 'Could not remove schedule item.', 'error'); } };
  return <><PageHeading eyebrow="MAKE SPACE FOR WHAT MATTERS" title="Schedule" subtitle="A flexible view of your classes and focused work." action={<button className="button button-primary" onClick={() => setFormOpen(true)}><Plus size={17} /> Add to schedule</button>} />
    <div className="schedule-summary"><span className="summary-icon"><CalendarDays size={20} /></span><div><strong>{schedule.length} planned {schedule.length === 1 ? 'block' : 'blocks'}</strong><span>across {grouped.length} {grouped.length === 1 ? 'day' : 'days'} this week</span></div><span className="today-chip">Today · {todayName()}</span></div>
    {grouped.length ? <div className="week-list">{grouped.map(({ day, items }) => <section className={`day-section ${day === todayName() ? 'day-today' : ''}`} key={day}><div className="day-label"><span>{day.slice(0, 3).toUpperCase()}</span><strong>{day}</strong>{day === todayName() && <i>Today</i>}</div><div className="day-events">{items.map((item) => <article className="schedule-event" key={item.id}><div className="event-time"><strong>{prettyTime(item.startTime)}</strong><span>{prettyTime(item.endTime)}</span></div><span className="event-accent" /><div className="event-copy"><strong>{item.title}</strong><span>{[item.course?.code, item.location].filter(Boolean).join(' · ') || item.notes || 'Personal study block'}</span></div><button className="icon-button danger-hover" aria-label={`Delete ${item.title}`} onClick={() => remove(item)}><Trash2 size={15} /></button></article>)}</div></section>)}</div> : <div className="panel page-empty-panel"><EmptyState icon={CalendarDays} title="A blank week is full of possibility" body="Add classes, study blocks or anything else you want to make time for." action={<button className="button button-primary" onClick={() => setFormOpen(true)}><Plus size={16} /> Plan your first block</button>} /></div>}
    {formOpen && <Modal title="Add to your schedule" subtitle="Give the block a name, a day and a little room." onClose={() => setFormOpen(false)}><form className="form-stack" onSubmit={submit}><div className="form-grid"><label>What is it?<input name="title" placeholder="Chemistry lecture" required /></label><label>Day<select name="dayOfWeek" defaultValue={todayName()}>{DAYS.map((day) => <option key={day}>{day}</option>)}</select></label><label>Starts<input type="time" name="startTime" required /></label><label>Ends<input type="time" name="endTime" required /></label><label>Course<select name="courseId" defaultValue=""><option value="">No course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} — {course.title}</option>)}</select></label><label>Location<input name="location" placeholder="Room 204 or online" /></label></div><label>Notes <span className="field-hint">optional</span><textarea name="notes" rows="2" placeholder="Anything to remember?" /></label><div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setFormOpen(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Add to schedule'}</button></div></form></Modal>}
  </>;
}

function TasksPage({ todos, courses, token, onTokenChange, onReload, onToggle, notify }) {
  const [formOpen, setFormOpen] = useState(false);
  const [filter, setFilter] = useState('open');
  const [saving, setSaving] = useState(false);
  const shown = todos.filter((item) => filter === 'all' || (filter === 'open' ? !item.completed : item.completed));
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); const form = new FormData(event.currentTarget);
    try { await apiRequest('/todos', { method: 'POST', token, onTokenChange, body: { title: form.get('title'), description: form.get('description') || undefined, dueDate: form.get('dueDate') || null, priority: form.get('priority'), category: form.get('category') || 'general', courseId: form.get('courseId') ? Number(form.get('courseId')) : null } }); await onReload(); setFormOpen(false); notify('Task added. One step closer.'); }
    catch (error) { notify(error.message || 'Could not add this task.', 'error'); } finally { setSaving(false); }
  };
  const remove = async (item) => { if (!window.confirm(`Delete “${item.title}”?`)) return; try { await apiRequest(`/todos/${item.id}`, { method: 'DELETE', token, onTokenChange }); await onReload(); notify('Task deleted.'); } catch (error) { notify(error.message || 'Could not delete task.', 'error'); } };
  return <><PageHeading eyebrow="YOUR NEXT SMALL WINS" title="Tasks & deadlines" subtitle="Break the big things into steps you can actually take." action={<button className="button button-primary" onClick={() => setFormOpen(true)}><Plus size={17} /> Add a task</button>} />
    <section className="task-overview"><div className="task-overview-copy"><span className="eyebrow">STAY GENTLE, STAY MOVING</span><h2>{todos.filter((item) => item.completed).length} of {todos.length} tasks completed</h2><p>Progress counts, even when it is small.</p></div><div className="progress-ring" style={{ '--progress': todos.length ? `${Math.round((todos.filter((item) => item.completed).length / todos.length) * 100)}%` : '0%' }}><span>{todos.length ? Math.round((todos.filter((item) => item.completed).length / todos.length) * 100) : 0}<small>%</small></span></div></section>
    <div className="list-toolbar"><div className="segmented-control">{[['open', 'To do'], ['done', 'Completed'], ['all', 'Everything']].map(([key, label]) => <button key={key} className={filter === key ? 'segment-active' : ''} onClick={() => setFilter(key)}>{label}<span>{key === 'open' ? todos.filter((item) => !item.completed).length : key === 'done' ? todos.filter((item) => item.completed).length : todos.length}</span></button>)}</div></div>
    <section className="panel task-page-panel">{shown.length ? <div className="task-list task-list-large">{shown.map((item) => <div className="task-row-wrap" key={item.id}><TaskRow item={item} onToggle={onToggle} /><button className="icon-button danger-hover task-delete" aria-label={`Delete ${item.title}`} onClick={() => remove(item)}><Trash2 size={15} /></button></div>)}</div> : <EmptyState icon={filter === 'done' ? CheckCircle2 : Circle} title={filter === 'done' ? 'No completed tasks yet' : 'Nothing on this list'} body={filter === 'done' ? 'The little checkmarks will collect here.' : 'A clear space is a good place to begin.'} action={filter !== 'done' && <button className="button button-outline button-small" onClick={() => setFormOpen(true)}><Plus size={15} /> Add a task</button>} />}</section>
    {formOpen && <Modal title="Add a task" subtitle="Write down the next thing, not the whole mountain." onClose={() => setFormOpen(false)}><form className="form-stack" onSubmit={submit}><label>Task<input name="title" required placeholder="Review lecture notes" /></label><div className="form-grid"><label>Due date<input name="dueDate" type="date" /></label><label>Priority<select name="priority" defaultValue="medium">{PRIORITIES.map((value) => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</select></label><label>Category<input name="category" placeholder="Study, personal…" defaultValue="general" /></label><label>Related course<select name="courseId" defaultValue=""><option value="">None</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} — {course.title}</option>)}</select></label></div><label>Notes <span className="field-hint">optional</span><textarea name="description" rows="3" placeholder="Anything that will help future you?" /></label><div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setFormOpen(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Add task'}</button></div></form></Modal>}
  </>;
}

function TaskRow({ item, onToggle, compact = false }) {
  const priority = (item.priority || 'medium').toLowerCase();
  return <div className={`task-row priority-row-${priority} ${item.completed ? 'task-done' : ''} ${compact ? 'task-compact' : ''}`}><button className={`task-check ${item.completed ? 'checked' : ''}`} aria-label={item.completed ? `Mark ${item.title} incomplete` : `Complete ${item.title}`} onClick={() => onToggle(item)}>{item.completed && <Check size={13} />}</button><span className="task-row-copy"><strong>{item.title}</strong>{!compact && item.description && <small>{item.description}</small>}<span className="task-meta"><span className={`priority-badge priority-${priority}`}><i className="priority-dot" />{priority}</span><i className="meta-separator" />{item.course?.code || item.category || 'Personal'}{!compact && item.dueDate && <><i className="meta-separator" /><Clock3 size={12} />{shortDate(item.dueDate)}</>}</span></span>{compact && <span className="task-due">{shortDate(item.dueDate)}</span>}</div>;
}

function MotivationPage({ motivations, token, onTokenChange, onReload, notify }) {
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const submit = async (event) => { event.preventDefault(); setSaving(true); const form = new FormData(event.currentTarget); try { await apiRequest('/motivation', { method: 'POST', token, onTokenChange, body: { quote: form.get('quote'), imageUrl: form.get('imageUrl') || null, isPinned: form.get('isPinned') === 'on' } }); await onReload(); setFormOpen(false); notify('A new reminder for future you.'); } catch (error) { notify(error.message || 'Could not save this note.', 'error'); } finally { setSaving(false); } };
  const togglePin = async (item) => { try { await apiRequest(`/motivation/${item.id}/pin`, { method: 'PATCH', body: {}, token, onTokenChange }); await onReload(); notify(item.isPinned ? 'Unpinned this note.' : 'Pinned as your active reminder.'); } catch (error) { notify(error.message || 'Could not update this note.', 'error'); } };
  const remove = async (item) => { if (!window.confirm('Delete this motivation note?')) return; try { await apiRequest(`/motivation/${item.id}`, { method: 'DELETE', token, onTokenChange }); await onReload(); notify('Note removed.'); } catch (error) { notify(error.message || 'Could not remove this note.', 'error'); } };
  return <><PageHeading eyebrow="A KIND WORD FOR THE JOURNEY" title="Motivation" subtitle="Collect the reminders you want close on the days you need them." action={<button className="button button-primary" onClick={() => setFormOpen(true)}><Plus size={17} /> Add a note</button>} />
    <section className="motivation-hero"><div className="motivation-sun" /><Sparkles className="motivation-sparkle" size={22} /><span className="eyebrow">YOUR CURRENT REMINDER</span><blockquote>{motivations.find((item) => item.isPinned)?.quote || motivations[0]?.quote || '“Success is the sum of small efforts, repeated day in and day out.”'}</blockquote><span className="motivation-byline">KEEP THIS CLOSE</span></section>
    <div className="motivation-heading"><div><span className="eyebrow">YOUR COLLECTION</span><h2>Words to return to</h2></div><span className="result-count">{motivations.length} saved</span></div>
    {motivations.length ? <div className="motivation-grid">{motivations.map((item, index) => <article className={`motivation-card motivation-tone-${index % 4}`} key={item.id}><span className="quote-mark">“</span><blockquote>{item.quote}</blockquote>{item.imageUrl && <a href={item.imageUrl} target="_blank" rel="noreferrer" className="motivation-image-link"><Link2 size={14} /> View image</a>}<div className="motivation-card-footer"><span>{item.isPinned ? <><Sparkles size={13} /> Pinned reminder</> : 'Saved for later'}</span><div><button className="text-link" onClick={() => togglePin(item)}>{item.isPinned ? 'Unpin' : 'Pin this'}</button><button className="icon-button danger-hover" aria-label="Delete note" onClick={() => remove(item)}><Trash2 size={15} /></button></div></div></article>)}</div> : <div className="panel page-empty-panel"><EmptyState icon={Quote} title="Your collection is waiting" body="Save a quote or kind reminder you want to come back to." action={<button className="button button-primary" onClick={() => setFormOpen(true)}><Plus size={16} /> Add a note</button>} /></div>}
    {formOpen && <Modal title="Add a reminder" subtitle="Save words you want to meet again." onClose={() => setFormOpen(false)}><form className="form-stack" onSubmit={submit}><label>Your quote<textarea name="quote" rows="4" required placeholder="Write a quote, mantra or note to yourself…" /></label><label>Image URL <span className="field-hint">optional</span><input name="imageUrl" type="url" placeholder="https://…" /></label><label className="checkbox-label"><input type="checkbox" name="isPinned" /> Make this my active reminder</label><div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setFormOpen(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save reminder'}</button></div></form></Modal>}
  </>;
}

function ProfilePage({ user, token, onTokenChange, onUser, notify, onLogout }) {
  const [saving, setSaving] = useState(false);
  const submit = async (event) => { event.preventDefault(); setSaving(true); const form = new FormData(event.currentTarget); try { const updated = await apiRequest('/auth/profile', { method: 'PATCH', token, onTokenChange, body: { fullName: form.get('fullName'), username: form.get('username'), bio: form.get('bio') } }); onUser(updated); notify('Profile saved.'); } catch (error) { notify(error.message || 'Could not update profile.', 'error'); } finally { setSaving(false); } };
  return <><PageHeading eyebrow="MAKE IT YOURS" title="Profile & settings" subtitle="A few details make this space feel like yours." />
    <div className="profile-layout"><section className="panel profile-card"><div className="profile-avatar avatar">{initials(user.fullName)}</div><h2>{user.fullName}</h2><p>{user.email}</p><span className="member-pill"><GraduationCap size={14} /> Student workspace</span><div className="profile-divider" /><div className="profile-fact"><span>Member since</span><strong>{user.createdAt ? shortDate(user.createdAt) : 'Welcome!'}</strong></div><div className="profile-fact"><span>Account email</span><strong>{user.email}</strong></div></section>
      <section className="panel profile-form-panel"><div className="panel-heading"><div><span className="eyebrow">PERSONAL DETAILS</span><h2>Your information</h2></div><UserRound size={19} className="panel-heading-icon" /></div><form className="form-stack" onSubmit={submit}><label>Full name<input name="fullName" defaultValue={user.fullName || ''} required /></label><label>Username<input name="username" defaultValue={user.username || ''} placeholder="Optional username" /></label><label>About you<textarea name="bio" defaultValue={user.bio || ''} rows="4" placeholder="What are you studying? What are you working toward?" /></label><div className="modal-actions"><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button></div></form><div className="profile-divider" /><div className="signout-row"><div><strong>Need a break?</strong><span>You can sign out of this device at any time.</span></div><button className="button button-outline" onClick={onLogout}><LogOut size={15} /> Sign out</button></div></section></div>
  </>;
}

function Modal({ title, subtitle, onClose, children }) {
  useEffect(() => { const onKey = (event) => { if (event.key === 'Escape') onClose(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onClose]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><div><h2 id="modal-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></div>{children}</section></div>;
}

export default App;
