
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';
import { Users, LogOut } from 'lucide-react';
import CreateGameDialog from '@/components/CreateGameDialog';

const LobbyScreen = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGames = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: teamIds, error: teamError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id);

    if (teamError) {
      toast({ variant: "destructive", title: "Erro ao buscar equipes", description: teamError.message });
      setLoading(false);
      return;
    }

    const userTeamIds = teamIds.map(t => t.team_id);

    if (userTeamIds.length > 0) {
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('id, team_red:teams!games_team_red_id_fkey(name), team_white:teams!games_team_white_id_fkey(name), status')
        .or(`team_red_id.in.(${userTeamIds.join(',')}),team_white_id.in.(${userTeamIds.join(',')})`)
        .neq('status', 'finished')
        .order('created_at', { ascending: false });
      
      if (gameError) {
        toast({ variant: "destructive", title: "Erro ao buscar jogos", description: gameError.message });
      } else {
        setGames(gameData);
      }
    } else {
      setGames([]);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchGames();
    
    const gameListener = supabase.channel('public:games')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, fetchGames)
      .subscribe();

    return () => {
      supabase.removeChannel(gameListener);
    }

  }, [fetchGames]);

  const handleManageTeams = () => {
     toast({
      title: "🚧 Em Desenvolvimento",
      description: "O gerenciamento de equipes será implementado em breve! 🚀",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black flex flex-col items-center p-4 text-white">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl p-6"
      >
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Bem-vindo, {user?.email?.split('@')[0] || 'Jogador'}!</h1>
          <Button onClick={signOut} variant="ghost" className="text-red-400 hover:text-red-500 hover:bg-red-900/20">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div whileHover={{ scale: 1.03 }}>
            <CreateGameDialog />
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }}>
            <Button onClick={handleManageTeams} variant="outline" className="w-full h-28 text-lg bg-transparent border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black flex flex-col gap-1">
              <Users size={28}/>
              Gerenciar Equipes
            </Button>
          </motion.div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Jogos Ativos</h2>
          <div className="bg-gray-800/50 rounded-lg p-4 min-h-[200px]">
            {loading ? (
              <p className="text-center text-gray-400">Carregando jogos...</p>
            ) : games.length === 0 ? (
              <p className="text-center text-gray-400 pt-10">Nenhum jogo ativo. Que tal criar um?</p>
            ) : (
              <ul className="space-y-3">
                <AnimatePresence>
                  {games.map((game, index) => (
                    <motion.li
                      key={game.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-700/70 p-4 rounded-lg flex justify-between items-center hover:bg-gray-700 transition-colors"
                    >
                      <div>
                        <span className="font-bold text-red-400">{game.team_red?.name || 'Equipe Vermelha'}</span>
                        <span className="mx-2 text-gray-400">vs</span>
                        <span className="font-bold text-blue-300">{game.team_white?.name || 'Equipe Branca'}</span>
                      </div>
                      <Button size="sm" onClick={() => navigate(`/game/${game.id}`)}>
                        Entrar no Jogo
                      </Button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LobbyScreen;
