import {state} from './state';
import {actions} from './actions';
import {mutations} from './mutations';

export const airPollution = {
    namespaced: true,
    state,
    actions,
    mutations,
};
