import { PrivateAxios } from '../../helpers/PrivateAxios';

export const getQuestions = async (params?: { circleId?: string; q?: string }) => {
    try {
        const response = await PrivateAxios.get('/questions', { params });
        return response.data;
    } catch (error: any) {
        console.error('getQuestions Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const getTrending = async () => {
    try {
        const response = await PrivateAxios.get('/questions/trending');
        return response.data;
    } catch (error: any) {
        console.error('getTrending questions Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const createQuestion = async (payload: { title: string; body?: string; tags?: string[]; circleId?: string }) => {
    try {
        const response = await PrivateAxios.post('/questions', payload);
        return response.data;
    } catch (error: any) {
        console.error('createQuestion Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const upvoteQuestion = async (questionId: string) => {
    try {
        const response = await PrivateAxios.post(`/questions/${questionId}/vote`);
        return response.data;
    } catch (error: any) {
        console.error('upvoteQuestion Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const addAnswer = async (questionId: string, text: string) => {
    try {
        const response = await PrivateAxios.post(`/questions/${questionId}/answers`, { text });
        return response.data;
    } catch (error: any) {
        console.error('addAnswer Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const getAnswers = async (questionId: string) => {
    try {
        const response = await PrivateAxios.get(`/questions/${questionId}/answers`);
        return response.data;
    } catch (error: any) {
        console.error('getAnswers Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const deleteQuestion = async (questionId: string) => {
    try {
        const response = await PrivateAxios.delete(`/questions/${questionId}`);
        return response.data;
    } catch (error: any) {
        console.error('deleteQuestion Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const getQuestionById = async (questionId: string) => {
    try {
        const response = await PrivateAxios.get(`/questions/${questionId}`);
        return response.data;
    } catch (error: any) {
        console.error('getQuestionById Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const questionApi = {
    getQuestions,
    getQuestionById,
    createQuestion,
    upvoteQuestion,
    addAnswer,
    getAnswers,
    deleteQuestion,
    getTrending,
};
