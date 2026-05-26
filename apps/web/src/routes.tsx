import { lazy } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/routing/ProtectedRoute';

const HomePage = lazy(() => import('./pages/HomePage'));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const CreatePostPage = lazy(() => import('./pages/CreatePostPage'));
const SavedPage = lazy(() => import('./pages/SavedPage'));
const TagsPage = lazy(() => import('./pages/TagsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MeRedirect = lazy(() => import('./pages/MeRedirect'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ManagePostsPage = lazy(() => import('./pages/ManagePostsPage'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'post/:id', element: <PostDetailPage /> },
      {
        path: 'saved',
        element: (
          <ProtectedRoute>
            <SavedPage />
          </ProtectedRoute>
        ),
      },
      { path: 'tags', element: <TagsPage /> },
      { path: 'profile/:username', element: <ProfilePage /> },
      { path: 'me', element: <MeRedirect /> },
      { path: 'search', element: <SearchPage /> },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute requireRole="ADMIN">
            <AdminPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/posts',
        element: (
          <ProtectedRoute requireRole="ADMIN">
            <ManagePostsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/create',
        element: (
          <ProtectedRoute requireRole="ADMIN">
            <CreatePostPage />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'auth/login', element: <LoginPage /> },
      { path: 'auth/register', element: <RegisterPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
