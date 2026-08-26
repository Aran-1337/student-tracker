import { questionsRepository } from '../repositories/questionsRepository';
import { QuestionBank, Question } from '../types';

export const questionsService = {
  async getBanksByTeacherId(teacherId: string): Promise<QuestionBank[]> {
    try {
      return await questionsRepository.getBanksByTeacherId(teacherId);
    } catch (error) {
      console.error('Error fetching question banks:', error);
      throw error;
    }
  },

  async addBank(bank: Omit<QuestionBank, 'id' | 'created_at'>): Promise<QuestionBank> {
    try {
      return await questionsRepository.addBank(bank);
    } catch (error) {
      console.error('Error adding question bank:', error);
      throw error;
    }
  },

  async deleteBank(id: string): Promise<void> {
    try {
      await questionsRepository.deleteBank(id);
    } catch (error) {
      console.error('Error deleting question bank:', error);
      throw error;
    }
  },

  async updateBank(id: string, updates: Partial<QuestionBank>): Promise<QuestionBank> {
    try {
      return await questionsRepository.updateBank(id, updates);
    } catch (error) {
      console.error('Error updating question bank:', error);
      throw error;
    }
  },

  async getQuestionsByBankId(bankId: string): Promise<Question[]> {
    try {
      return await questionsRepository.getQuestionsByBankId(bankId);
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  },

  async addQuestion(question: Omit<Question, 'id' | 'created_at'>): Promise<Question> {
    try {
      return await questionsRepository.addQuestion(question);
    } catch (error) {
      console.error('Error adding question:', error);
      throw error;
    }
  },

  async deleteQuestion(id: string): Promise<void> {
    try {
      await questionsRepository.deleteQuestion(id);
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  },

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
    try {
      return await questionsRepository.updateQuestion(id, updates);
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  }
};
