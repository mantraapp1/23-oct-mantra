import { supabase } from '@/lib/supabase/client';
import type { Contest, ContestSubmissionWithNovel, Novel } from '@/types/supabase';

class ContestService {
    /**
     * Check if there are any contests created
     */
    async hasAnyContests(): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('contests')
                .select('id')
                .limit(1);

            if (error) throw error;
            return !!(data && data.length > 0);
        } catch (error) {
            console.error('Error in hasAnyContests:', error);
            return false;
        }
    }

    /**
     * Get all contests (ordered by start date, newest first)
     */
    async getAllContests(): Promise<Contest[]> {
        try {
            const { data, error } = await supabase
                .from('contests')
                .select('*')
                .order('start_date', { ascending: false });

            if (error) throw error;
            return data as Contest[];
        } catch (error) {
            console.error('Error in getAllContests:', error);
            return [];
        }
    }

    /**
     * Get a single contest by ID
     */
    async getContestById(contestId: string): Promise<Contest | null> {
        try {
            const { data, error } = await supabase
                .from('contests')
                .select('*')
                .eq('id', contestId)
                .single();

            if (error) throw error;
            return data as Contest;
        } catch (error) {
            console.error('Error in getContestById:', error);
            return null;
        }
    }

    /**
     * Get submissions for a contest, ordered by votes (highest first)
     */
    async getContestSubmissions(contestId: string): Promise<ContestSubmissionWithNovel[]> {
        try {
            const { data, error } = await supabase
                .from('contest_submissions')
                .select('*, novel:novels!novel_id(*, author:profiles!author_id(*))')
                .eq('contest_id', contestId)
                .order('votes_count', { ascending: false });

            if (error) throw error;
            return data as unknown as ContestSubmissionWithNovel[];
        } catch (error) {
            console.error('Error in getContestSubmissions:', error);
            return [];
        }
    }

    /**
     * Get the user's novels and determine eligibility for a specific contest.
     * Returns novels with an 'eligible' flag and a reason if ineligible.
     */
    async getUserEligibleNovels(contestId: string, userId: string): Promise<Array<Novel & { isEligible: boolean; reason?: string }>> {
        try {
            // 1. Get contest dates and requirements
            const contest = await this.getContestById(contestId);
            if (!contest) throw new Error('Contest not found');

            // 2. Get user's novels
            const { data: novels, error: novelsError } = await supabase
                .from('novels')
                .select('*')
                .eq('author_id', userId);

            if (novelsError) throw novelsError;

            // 3. Get existing submissions for this user in this contest to enforce one submission per author
            const { data: userSubmissions, error: userSubError } = await supabase
                .from('contest_submissions')
                .select('novel_id')
                .eq('contest_id', contestId)
                .eq('user_id', userId);

            if (userSubError) throw userSubError;

            const userSubmittedNovelId = userSubmissions && userSubmissions.length > 0 ? userSubmissions[0].novel_id : null;
            const contestStartDate = new Date(contest.start_date);

            return (novels || []).map((novel: Novel) => {
                // If this specific novel is already submitted
                if (novel.id === userSubmittedNovelId) {
                    return {
                        ...novel,
                        isEligible: false,
                        reason: 'Already submitted to this contest'
                    };
                }

                // If user has submitted ANOTHER novel to this contest
                if (userSubmittedNovelId !== null) {
                    return {
                        ...novel,
                        isEligible: false,
                        reason: 'One submission allowed per author per contest'
                    };
                }

                // If contest requires new novels, check creation date
                if (contest.requires_new_novel) {
                    const novelCreatedDate = new Date(novel.created_at);
                    if (novelCreatedDate < contestStartDate) {
                        return {
                            ...novel,
                            isEligible: false,
                            reason: `Requires novel created after ${contestStartDate.toLocaleDateString()}`
                        };
                    }
                }

                return {
                    ...novel,
                    isEligible: true
                };
            });
        } catch (error) {
            console.error('Error in getUserEligibleNovels:', error);
            return [];
        }
    }

    /**
     * Submit a novel to a contest
     */
    async submitNovel(contestId: string, novelId: string, userId: string): Promise<{ success: boolean; message: string }> {
        try {
            // Check if the author has already submitted a novel to this contest
            const { data: existing, error: checkError } = await supabase
                .from('contest_submissions')
                .select('id')
                .eq('contest_id', contestId)
                .eq('user_id', userId)
                .limit(1);

            if (checkError) throw checkError;
            if (existing && existing.length > 0) {
                return { success: false, message: 'You have already submitted a novel to this contest. Only one novel is allowed per author.' };
            }

            const { error } = await supabase
                .from('contest_submissions')
                .insert({
                    contest_id: contestId,
                    novel_id: novelId,
                    user_id: userId
                });

            if (error) throw error;
            return { success: true, message: 'Novel submitted successfully!' };
        } catch (error: any) {
            console.error('Error in submitNovel:', error);
            return { success: false, message: error.message || 'Failed to submit novel' };
        }
    }

    /**
     * Withdraw a novel from a contest
     */
    async withdrawSubmission(contestId: string, novelId: string): Promise<{ success: boolean; message: string }> {
        try {
            const { error } = await supabase
                .from('contest_submissions')
                .delete()
                .eq('contest_id', contestId)
                .eq('novel_id', novelId);

            if (error) throw error;
            return { success: true, message: 'Submission withdrawn successfully!' };
        } catch (error: any) {
            console.error('Error in withdrawSubmission:', error);
            return { success: false, message: error.message || 'Failed to withdraw submission' };
        }
    }

    /**
     * Vote for a submission in a contest.
     * Inserts a record in contest_votes. Trigger handles votes_count in contest_submissions.
     */
    async voteForSubmission(contestId: string, submissionId: string, userId: string): Promise<{ success: boolean; message: string }> {
        try {
            const { error } = await supabase
                .from('contest_votes')
                .insert({
                    contest_id: contestId,
                    submission_id: submissionId,
                    user_id: userId
                });

            if (error) throw error;
            return { success: true, message: 'Vote registered!' };
        } catch (error: any) {
            console.error('Error in voteForSubmission:', error);
            if (error.code === '23505') {
                return { success: false, message: 'You have already voted in this contest. Retract your other vote first.' };
            }
            return { success: false, message: error.message || 'Failed to vote' };
        }
    }

    /**
     * Retract a vote for a submission
     */
    async retractVote(contestId: string, userId: string): Promise<{ success: boolean; message: string }> {
        try {
            const { error } = await supabase
                .from('contest_votes')
                .delete()
                .eq('contest_id', contestId)
                .eq('user_id', userId);

            if (error) throw error;
            return { success: true, message: 'Vote retracted!' };
        } catch (error: any) {
            console.error('Error in retractVote:', error);
            return { success: false, message: error.message || 'Failed to retract vote' };
        }
    }

    /**
     * Fetch user's active vote in a specific contest (returns submission_id if found)
     */
    async getUserActiveVote(contestId: string, userId: string): Promise<string | null> {
        try {
            const { data, error } = await supabase
                .from('contest_votes')
                .select('submission_id')
                .eq('contest_id', contestId)
                .eq('user_id', userId)
                .maybeSingle();

            if (error) throw error;
            return data ? data.submission_id : null;
        } catch (error) {
            console.error('Error in getUserActiveVote:', error);
            return null;
        }
    }
}

export default new ContestService();
