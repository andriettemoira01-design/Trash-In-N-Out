import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RecycleCalculator from './RecycleCalculator';
import { AuthProvider } from '../contexts/AuthContext';

// Mock Firebase
jest.mock('../firebase', () => ({
  firestore: {},
}));

// Mock AuthContext with test data
const mockAuthContext = {
  currentUser: {
    uid: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'junkshop' as const,
    points: 0,
  },
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('RecycleCalculator', () => {
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          {component}
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('renders calculator title', () => {
    renderWithProviders(<RecycleCalculator />);
    expect(screen.getByText('Recycle Calculator')).toBeInTheDocument();
  });

  test('shows junkshop-specific content for junkshop users', () => {
    renderWithProviders(<RecycleCalculator />);
    expect(screen.getByText('Calculate using your pricing')).toBeInTheDocument();
    expect(screen.getByText('Your Prices')).toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    renderWithProviders(<RecycleCalculator />);
    expect(screen.getByText('Loading material prices...')).toBeInTheDocument();
  });
});
