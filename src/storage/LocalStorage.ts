export interface LeaderboardEntry {
    name: string;
    score: number;
    date: string;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    unlocked: boolean;
}

export class Storage {
    static getLeaderboard(): LeaderboardEntry[] {
        const data = localStorage.getItem('snake_leaderboard');
        return data ? JSON.parse(data) : [];
    }

    static saveScore(name: string, score: number) {
        const leaderboard = this.getLeaderboard();
        leaderboard.push({
            name,
            score,
            date: new Date().toLocaleDateString()
        });
        leaderboard.sort((a, b) => b.score - a.score);
        localStorage.setItem('snake_leaderboard', JSON.stringify(leaderboard.slice(0, 10)));
    }

    static getAchievements(): Achievement[] {
        const data = localStorage.getItem('snake_achievements');
        const defaultAchievements: Achievement[] = [
            { id: 'first_food', title: 'Первая еда', description: 'Съешьте свой первый фрукт', unlocked: false },
            { id: 'length_50', title: 'Длинная змея', description: 'Достигните длины 50', unlocked: false },
            { id: 'length_100', title: 'Гигантская змея', description: 'Достигните длины 100', unlocked: false },
            { id: 'portal_master', title: 'Мастер порталов', description: 'Войдите в портал 10 раз', unlocked: false }
        ];
        
        if (!data) return defaultAchievements;
        const saved = JSON.parse(data);
        return defaultAchievements.map(d => ({
            ...d,
            unlocked: saved.find((s: any) => s.id === d.id)?.unlocked || false
        }));
    }

    static unlockAchievement(id: string) {
        const achievements = this.getAchievements();
        const achievement = achievements.find(a => a.id === id);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            localStorage.setItem('snake_achievements', JSON.stringify(achievements));
            return true;
        }
        return false;
    }
}
