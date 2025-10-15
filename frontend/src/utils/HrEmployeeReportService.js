import axios from 'axios';
import API_BASE_URL from '../api.config';

const API_URL = `${API_BASE_URL}/form/employees-data`;

export const fetchEmployees = async () => {
  return axios.get(API_URL);
};

// Create a new HR Employee entry
export const newcreateEmployee = async (employeeData) => {
  return axios.post(API_URL, employeeData);
};

export const updateEmployee = async (id, employeeData) => {
  return axios.put(`${API_BASE_URL}/${id}`, employeeData);
};

export const deleteEmployee = async (id) => {
  return axios.delete(`${API_BASE_URL}/${id}`);
};

export const getCompanyNames = async () => {
  return await axios.get(`${API_BASE_URL}/form/company-names`);
};
