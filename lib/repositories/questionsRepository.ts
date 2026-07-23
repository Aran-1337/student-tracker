import { supabase } from '../supabaseClient';
import { QuestionBank, Question } from '../types';

export const questionsRepository = {
  async getBanksByTeacherId(teacherId: string): Promise<QuestionBank[]> {
    const { data, error } = await supabase
      .from('question_banks')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  },

  async addBank(bank: Omit<QuestionBank, 'id' | 'created_at'>): Promise<QuestionBank> {
    const { data, error } = await supabase
      .from('question_banks')
      .insert(bank)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async deleteBank(id: string): Promise<void> {
    const { error } = await supabase
      .from('question_banks')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  },

  async getQuestionsByBankId(bankId: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('bank_id', bankId)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    return data || [];
  },

  async addQuestion(question: Omit<Question, 'id' | 'created_at'>): Promise<Question> {
    const { data, error } = await supabase
      .from('questions')
      .insert(question)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async deleteQuestion(id: string): Promise<void> {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }
};
