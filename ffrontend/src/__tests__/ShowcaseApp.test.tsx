import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import { FEATURE_CARDS, TECH_STACK_ITEMS } from '../data/showcaseContent';

describe('OPERO Release 1 Showcase (ffrontend)', () => {
  it('renders the Prototype – in development banner and appbar Opero. wordmark', () => {
    render(<App />);
    expect(screen.getByText(/Prototype – in development/i)).toBeInTheDocument();
    const navButton = screen.getByRole('button', { name: /OPERO — Back to start/i });
    const wordmark = navButton.querySelector('.opero-appbar-wordmark');
    expect(wordmark).not.toBeNull();
    expect(wordmark?.textContent).toBe('Opero.');
  });

  it('renders all 10 pure white feature cards with Windows System Tray', () => {
    const { container } = render(<App />);
    const cards = container.querySelectorAll('#features .feature-card');
    expect(cards.length).toBe(FEATURE_CARDS.length);
    for (const item of FEATURE_CARDS) {
      expect(screen.getByRole('heading', { name: item.title })).toBeInTheDocument();
    }
    expect(screen.getByRole('heading', { name: /^System Tray$/i })).toBeInTheDocument();
  });

  it('renders the official Tech Stack Brand Belt and Export Deliverables', () => {
    render(<App />);
    for (const tech of TECH_STACK_ITEMS) {
      expect(screen.getAllByText(tech.name).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/^\.pdf$/i)).toBeInTheDocument();
    expect(screen.getByText(/^\.docx$/i)).toBeInTheDocument();
    expect(screen.getByText(/\.md · Coming soon/i)).toBeInTheDocument();
    expect(screen.getByText(/\.html · Coming soon/i)).toBeInTheDocument();
    expect(screen.queryByText(/Release 1 Roadmap/i)).toBeNull();
  });

  it('uses consistent Pero mascot naming without a phone mockup', () => {
    render(<App />);
    expect(screen.getByText(/Meet Pero/i)).toBeInTheDocument();
    const privacyTab = screen.getByRole('tab', { name: /^Privacy$/i });
    fireEvent.click(privacyTab);
    expect(privacyTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/stays on your PC/i)).toBeInTheDocument();
  });

  it('supports interactive language preview and Windows Ctrl shortcuts', () => {
    render(<App />);
    const jaTab = screen.getByRole('tab', { name: /日本語/i });
    fireEvent.click(jaTab);
    expect(jaTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Filipino \(Coming soon\)/i })).toBeInTheDocument();

    const exportKey = screen.getByRole('button', { name: /Export PDF \/ Word/i });
    fireEvent.click(exportKey);
    expect(screen.getByText(/exported to PDF!/i)).toBeInTheDocument();
  });

  it('shows Windows first as Coming Soon and macOS as Coming Later', () => {
    render(<App />);
    const winBtns = screen.getAllByRole('button', { name: /Windows · Coming Soon/i });
    expect(winBtns.length).toBe(2);
    for (const btn of winBtns) expect(btn).toBeDisabled();

    const macBtns = screen.getAllByRole('button', { name: /macOS · Coming later/i });
    expect(macBtns.length).toBe(2);
    for (const btn of macBtns) expect(btn).toBeDisabled();
  });

  it('renders clean footer with zero company, personal name, or GitHub links and opens Terms & Privacy modal', () => {
    const { container } = render(<App />);
    expect(container.textContent).not.toMatch(/\bMMI\b|Man Machine Interface|マンマシン|Arron|Kian|Parejas/i);
    expect(container.querySelector('a[href*="github.com"]')).toBeNull();

    const termsBtn = screen.getByRole('button', { name: /^Terms & Conditions$/i });
    fireEvent.click(termsBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Project Scope/i)).toBeInTheDocument();

    const privacyTab = screen.getByRole('tab', { name: /^Privacy Policy$/i });
    fireEvent.click(privacyTab);
    expect(screen.getByText(/Local-First Data Ownership/i)).toBeInTheDocument();
  });

  it('triggers child voiceover and displays matching spoken caption when clicking Pero', () => {
    render(<App />);
    const peroButtons = screen.getAllByRole('button', { name: /Interact with Pero/i });
    expect(peroButtons.length).toBeGreaterThan(0);
    fireEvent.click(peroButtons[0]);
    expect(screen.getByText(/^Opero!$/)).toBeInTheDocument();
  });

  it('morphs enlarged feature icons on card interaction and keeps horizontal track', () => {
    const { container } = render(<App />);
    const track = screen.getByTestId('features-horizontal-track');
    expect(track).toBeInTheDocument();
    const firstCard = container.querySelector('#features .feature-card') as HTMLElement;
    expect(firstCard).toHaveAttribute('data-morphed', 'false');
    const svg = firstCard.querySelector('svg');
    expect(Number(svg?.getAttribute('height'))).toBeGreaterThanOrEqual(80);

    fireEvent.click(firstCard);
    expect(firstCard).toHaveAttribute('data-morphed', 'true');
  });

  it('renders ambient 20-motion Pero background stickers with interactive hints', () => {
    render(<App />);
    const sticker = screen.getByTestId('pero-sticker-v-1');
    expect(sticker).toBeInTheDocument();
    fireEvent.mouseEnter(sticker);
    expect(screen.getByTestId('pero-sticker-hint-v-1')).toBeInTheDocument();
    fireEvent.click(sticker);
    expect(screen.getByTestId('pero-sticker-hint-v-1')).toBeInTheDocument();
  });

  it('opens mobile hamburger drawer with quick sections and closes on Escape', async () => {
    render(<App />);
    const menuBtn = screen.getByRole('button', { name: /Open navigation menu/i });
    expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(menuBtn);
    expect(screen.getByRole('navigation', { name: /Mobile sections/i })).toBeInTheDocument();
    expect(screen.getByText(/Quick Sections/i)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('button', { name: /Open navigation menu/i })).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => {
      expect(screen.queryByRole('navigation', { name: /Mobile sections/i })).toBeNull();
    });
  });
});
