import { authApi } from '../auth/authApi';
import { userDiscoverApi } from '../users/discoverApi';

export const vetProfileApi = {
  getMyReviews: (vetId: string) => userDiscoverApi.getVetReviews(vetId),
  updateWorkingHours: (workingHours: string) => authApi.updateProfile({ working_hours: workingHours }),
};
