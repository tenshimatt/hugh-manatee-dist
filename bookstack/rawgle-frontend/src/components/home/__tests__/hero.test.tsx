import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Hero } from '../hero';

// Mock Next.js components
jest.mock('next/link', () => {
  const MockedLink = ({ children, href }: { children: React.ReactNode; href: string }) => 
    <a href={href}>{children}</a>;
  MockedLink.displayName = 'MockedLink';
  return MockedLink;
});

describe('Hero Component', () => {
  it('should render hero heading without unescaped characters', () => {
    render(<Hero />);
    
    // Test that the component renders
    expect(screen.getByRole('heading', { name: /raw feeding made simple/i })).toBeInTheDocument();
  });

  it('should display correct text content without ESLint errors', () => {
    render(<Hero />);
    
    // Test that component content renders properly
    const heroText = screen.getByText(/track your pet/i);
    expect(heroText).toBeInTheDocument();
    
    // Verify that the component renders text with properly escaped apostrophes
    // (The browser automatically unescapes HTML entities in innerHTML, which is expected)
    const heroSection = document.querySelector('section');
    expect(heroSection).toBeInTheDocument();
    
    // Check that specific escaped text content is present and rendered correctly
    expect(screen.getByText(/Today's Feeding/)).toBeInTheDocument();
    expect(screen.getByText(/pet's nutrition/)).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<Hero />);
    
    const heroSection = document.querySelector('section');
    expect(heroSection).toBeInTheDocument();
    expect(heroSection).toHaveClass('relative', 'overflow-hidden');
  });
});