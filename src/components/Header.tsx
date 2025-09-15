import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, BarChart3, Settings, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import CartDrawer from './CartDrawer';

const Header = () => {
  const { itemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    setUserRole(data?.role || 'customer');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    { name: 'Jerseys', href: '/category/jerseys' },
    { name: 'Shorts', href: '/category/shorts' },
    { name: 'Accessories', href: '/category/accessories' },
  ];

  const adminNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Admin', href: '/admin', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary">
            <span className="text-sm font-bold text-primary-foreground">TS</span>
          </div>
          <span className="text-xl font-bold text-foreground">Tahir Sports</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {item.name}
            </Link>
          ))}
          {user && userRole === 'admin' && (
            <>
              {adminNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sports equipment..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="block px-2 py-2 text-lg font-medium text-foreground hover:text-primary"
                    >
                      {item.name}
                    </Link>
                  ))}
                  {user && userRole === 'admin' && (
                    <>
                      <div className="border-t pt-2 mt-4">
                        <h4 className="px-2 py-1 text-sm font-semibold text-muted-foreground">Admin</h4>
                        {adminNavigation.map((item) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            className="flex items-center gap-2 px-2 py-2 text-lg font-medium text-foreground hover:text-primary"
                          >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="border-t pt-4 space-y-2">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setIsCartOpen(true)}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Cart {itemCount > 0 && `(${itemCount})`}
                  </Button>
                  {user ? (
                    <div className="space-y-2">
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        Welcome, {user.email?.split('@')[0]}
                      </div>
                      <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                        <User className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Link to="/auth">
                      <Button variant="ghost" className="w-full justify-start">
                        <User className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* User Account - Desktop */}
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.email?.split('@')[0]}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <Link to="/auth" className="hidden md:block">
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-1" />
                Sign In
              </Button>
            </Link>
          )}

          {/* Cart */}
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                {itemCount > 99 ? '99+' : itemCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="border-t px-4 py-3 md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sports equipment..."
            className="pl-10"
          />
        </div>
      </div>

      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
};

export default Header;