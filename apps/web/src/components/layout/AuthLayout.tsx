import { Outlet } from 'react-router';

// Minimal layout cho /auth/* — không TopBar/StatusBar, chỉ centered content.
// Login page tự render brand mark + form theo design-file/MyBlog Login.html.
export function AuthLayout() {
  return (
    <div className="min-h-screen bg-bg text-tp font-sans antialiased flex items-center justify-center px-4">
      <Outlet />
    </div>
  );
}
