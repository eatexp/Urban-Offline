import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ContextSettings from './ContextSettings';

// Mock the userContextManager
vi.mock('../services/context/UserContextManager', () => {
    return {
        userContextManager: {
            getAll: vi.fn().mockImplementation(async () => {
                return {
                    inventory: { items: [{ id: '1', name: 'Test Item', quantity: 2, category: 'general' }] },
                    medical: { allergies: ['Peanuts'], conditions: [], bloodType: 'O+' },
                    location: { home: { address: '123 St', postcode: 'SW1', floor: '1', layout: 'Flat' }, work: {} },
                    resources: { water: { bottled: 10, stored: 0 }, food: { daysSupply: 3 }, cash: 50 }
                };
            }),
            setInventory: vi.fn(),
            setMedical: vi.fn(),
            setLocation: vi.fn(),
            setResources: vi.fn(),
            exportJSON: vi.fn(),
            importJSON: vi.fn(),
        }
    };
});

describe('ContextSettings Accessibility', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should have accessible names for Inventory inputs and buttons', async () => {
        render(<ContextSettings onClose={() => {}} />);
        await waitFor(() => expect(screen.getByPlaceholderText(/Item name/i)).toBeInTheDocument());

        // Item Name Input
        const nameInput = screen.getByPlaceholderText(/Item name/i);
        // We expect this to have aria-label="Item name"
        expect(nameInput).toHaveAttribute('aria-label', 'Item name');

        // Quantity Input
        const qtyInput = screen.getByPlaceholderText(/Qty/i);
        expect(qtyInput).toHaveAttribute('aria-label', 'Item quantity');

        // Category Select
        // Find by value 'general'
        const selects = screen.getAllByRole('combobox');
        const catSelect = selects.find(s => s.value === 'general');
        expect(catSelect).toHaveAttribute('aria-label', 'Item category');

        // Add Item Button
        // It's the button with the Plus icon. It's the last button in the row typically.
        // We can find it by looking for the one that calls addItem.
        // Better to find by expected aria-label if we are testing it exists.
        const addBtn = screen.getByLabelText('Add item');
        expect(addBtn).toBeInTheDocument();

        // Remove Item Button
        // Should have aria-label="Remove Test Item"
        const removeBtn = screen.getByLabelText('Remove Test Item');
        expect(removeBtn).toBeInTheDocument();
    });

    it('should have accessible names for Medical inputs', async () => {
        render(<ContextSettings onClose={() => {}} />);
        // Use getByRole to be more specific and avoid potential text matching issues
        const medicalTab = await screen.findByRole('button', { name: /Medical/i });
        fireEvent.click(medicalTab);

        // Allergies Input
        // Should be associated with label "Allergies"
        const allergiesInput = await screen.findByLabelText('Allergies');
        expect(allergiesInput).toBeInTheDocument();
        expect(allergiesInput).toHaveAttribute('id');

        // Conditions Input
        const conditionsInput = screen.getByLabelText('Medical Conditions');
        expect(conditionsInput).toBeInTheDocument();

        // Blood Type Select
        const bloodSelect = screen.getByLabelText('Blood Type');
        expect(bloodSelect).toBeInTheDocument();
    });

    it('should have accessible names for Location inputs', async () => {
        render(<ContextSettings onClose={() => {}} />);
        const locationTab = await screen.findByRole('button', { name: /Location/i });
        fireEvent.click(locationTab);

        // Home Address
        // The input has placeholder "Address" but no visible label text except header "Home"
        // So we expect aria-label="Home Address"
        const homeAddress = screen.getByLabelText('Home Address');
        expect(homeAddress).toBeInTheDocument();

        // Postcode
        const postcode = screen.getByLabelText('Home Postcode');
        expect(postcode).toBeInTheDocument();
    });

    it('should have accessible Close button', async () => {
        render(<ContextSettings onClose={() => {}} />);
        await waitFor(() => expect(screen.getByRole('heading', { name: /My Context/i })).toBeInTheDocument());

        const closeBtn = screen.getByLabelText('Close settings');
        expect(closeBtn).toBeInTheDocument();
    });
});
