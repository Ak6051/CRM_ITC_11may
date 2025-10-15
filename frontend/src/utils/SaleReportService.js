import axios from 'axios';
import API_BASE_URL from '../api.config';

const API_URL = `${API_BASE_URL}/report`;

export const fetchSales = async () => {
    return axios.get(API_URL);
};

export const createSale = async (saleData) => {
    return axios.post(API_URL, saleData);
};


export const updateSale = async (id, saleData) => {
    return axios.put(`${API_URL}/${id}`, saleData);
};

export const deleteSale = async (id) => {
    return axios.delete(`${API_URL}/${id}`);
};

export const fetchHRUsers = async () => {
    return await axios.get(`${API_BASE_URL}/hr/hr-users`);
};