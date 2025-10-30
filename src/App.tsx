import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { AuthPage } from './components/pages/AuthPage';
import { ProjectsPage } from './components/pages/ProjectsPage';
import { TasksPage } from './components/pages/TasksPage';
import { TagsPage } from './components/pages/TagsPage';
import { ProfilePage } from './components/pages/ProfilePage';
import { CalendarPage } from './components/pages/CalendarPage';
import { PriorityGridPage } from './components/pages/PriorityGridPage';

function App() {
  const [currentPage, setCurrentPage] = useState<'projects' | 'tasks' | 'calendar' | 'priority-grid' | 'tags' | 'profile'>(
    'projects'
  );

  const renderPage = () => {
    switch (currentPage) {
      case 'projects':
        return <ProjectsPage />;
      case 'tasks':
        return <TasksPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'priority-grid':
        return <PriorityGridPage />;
      case 'tags':
        return <TagsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <ProjectsPage />;
    }
  };

  return (
    <AuthProvider>
      <ProtectedRoute fallback={<AuthPage onAuthSuccess={() => {}} />}>
        <MainLayout currentPage={currentPage} onNavigate={setCurrentPage}>
          {renderPage()}
        </MainLayout>
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
