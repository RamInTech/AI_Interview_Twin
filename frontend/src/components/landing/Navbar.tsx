import { Button } from '@/components/ui/button';
import { LogOut, Codepen } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
export default function Navbar() {
  const navigate = useNavigate();
  const {
    user,
    signOut
  } = useAuth();
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  return <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg gradient-bg flex items-center justify-center">
              <Codepen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">AI Interview Twin</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? <>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </> : <>
                <Button variant="ghost" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
                <Button onClick={() => navigate('/auth')} className="gradient-bg text-primary-foreground">
                  Get Started
                </Button>
              </>}
          </div>
        </div>
      </div>
    </nav>;
}