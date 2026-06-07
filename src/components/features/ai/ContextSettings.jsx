import React, { useState, useEffect } from 'react';
import {
    Package, Heart, MapPin, Droplets, X, Plus, Trash2,
    Save, Download, Upload, AlertCircle
} from 'lucide-react';
import { userContextManager } from '../services/context/UserContextManager';
import { createLogger } from '../utils/logger';

const log = createLogger('ContextSettings');

/**
 * Context Settings Component
 *
 * Allows users to configure their personal context for emergency protocols:
 * - Inventory (bug-out bag, supplies)
 * - Medical profile (allergies, medications, conditions)
 * - Location data (home, work, family)
 * - Resources (water, food, fuel, cash)
 */
const ContextSettings = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('inventory');
    const [inventory, setInventory] = useState({ items: [] });
    const [medical, setMedical] = useState({});
    const [location, setLocation] = useState({});
    const [resources, setResources] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    // Load context on mount
    useEffect(() => {
        loadContext();
    }, []);

    const loadContext = async () => {
        try {
            const context = await userContextManager.getAll();
            setInventory(context.inventory);
            setMedical(context.medical);
            setLocation(context.location);
            setResources(context.resources);
        } catch (error) {
            log.error('Failed to load context', error);
        }
    };

    const saveContext = async () => {
        try {
            setIsSaving(true);

            if (activeTab === 'inventory') {
                await userContextManager.setInventory(inventory.items || []);
            } else if (activeTab === 'medical') {
                await userContextManager.setMedical(medical);
            } else if (activeTab === 'location') {
                await userContextManager.setLocation(location);
            } else if (activeTab === 'resources') {
                await userContextManager.setResources(resources);
            }

            setSaveMessage('✓ Saved');
            setTimeout(() => setSaveMessage(''), 2000);
        } catch (error) {
            log.error('Failed to save context', error);
            setSaveMessage('✗ Error');
            setTimeout(() => setSaveMessage(''), 2000);
        } finally {
            setIsSaving(false);
        }
    };

    const exportContext = async () => {
        try {
            const json = await userContextManager.exportJSON();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `urban-offline-context-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            log.error('Failed to export context', error);
        }
    };

    const importContext = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                await userContextManager.importJSON(e.target?.result);
                await loadContext();
                setSaveMessage('✓ Imported');
                setTimeout(() => setSaveMessage(''), 2000);
            } catch (error) {
                log.error('Failed to import context', error);
                setSaveMessage('✗ Import failed');
                setTimeout(() => setSaveMessage(''), 2000);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="font-bold text-lg">My Context</h2>
                    <div className="flex items-center gap-2">
                        {saveMessage && (
                            <span className="text-sm text-green-600">{saveMessage}</span>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg" aria-label="Close">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="p-3 bg-blue-50 border-b border-blue-100">
                    <div className="flex items-start gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-blue-900">
                            This information helps generate personalized emergency protocols.
                            All data is stored locally and never synced to the cloud.
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 overflow-x-auto">
                    <TabButton
                        active={activeTab === 'inventory'}
                        onClick={() => setActiveTab('inventory')}
                        icon={<Package className="w-4 h-4" />}
                        label="Inventory"
                    />
                    <TabButton
                        active={activeTab === 'medical'}
                        onClick={() => setActiveTab('medical')}
                        icon={<Heart className="w-4 h-4" />}
                        label="Medical"
                    />
                    <TabButton
                        active={activeTab === 'location'}
                        onClick={() => setActiveTab('location')}
                        icon={<MapPin className="w-4 h-4" />}
                        label="Location"
                    />
                    <TabButton
                        active={activeTab === 'resources'}
                        onClick={() => setActiveTab('resources')}
                        icon={<Droplets className="w-4 h-4" />}
                        label="Resources"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'inventory' && (
                        <InventoryTab inventory={inventory} setInventory={setInventory} />
                    )}
                    {activeTab === 'medical' && (
                        <MedicalTab medical={medical} setMedical={setMedical} />
                    )}
                    {activeTab === 'location' && (
                        <LocationTab location={location} setLocation={setLocation} />
                    )}
                    {activeTab === 'resources' && (
                        <ResourcesTab resources={resources} setResources={setResources} />
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportContext}
                            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <label className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 cursor-pointer">
                            <Upload className="w-4 h-4" />
                            Import
                            <input
                                type="file"
                                accept=".json"
                                onChange={importContext}
                                className="hidden"
                            />
                        </label>
                    </div>
                    <button
                        onClick={saveContext}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

// Tab Button Component
const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            active
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
        }`}
    >
        {icon}
        {label}
    </button>
);

// Inventory Tab
const InventoryTab = ({ inventory, setInventory }) => {
    const [newItem, setNewItem] = useState({ name: '', quantity: 1, category: 'general' });

    const addItem = () => {
        if (!newItem.name.trim()) return;

        const item = {
            id: Date.now().toString(),
            ...newItem,
            addedAt: new Date().toISOString()
        };

        setInventory({
            items: [...(inventory.items || []), item]
        });

        setNewItem({ name: '', quantity: 1, category: 'general' });
    };

    const removeItem = (id) => {
        setInventory({
            items: (inventory.items || []).filter(item => item.id !== id)
        });
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-600">
                List items in your bug-out bag or emergency supplies. This helps protocols recommend actions based on what you actually have.
            </p>

            {/* Add Item Form */}
            <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                <input
                    type="text"
                    placeholder="Item name (e.g., Water bottle, Lighter)"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                        className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                        value={newItem.category}
                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="general">General</option>
                        <option value="water">Water/Food</option>
                        <option value="medical">Medical</option>
                        <option value="tools">Tools</option>
                        <option value="communication">Communication</option>
                    </select>
                    <button
                        onClick={addItem}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Items List */}
            <div className="space-y-2">
                {(inventory.items || []).map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                        <div>
                            <span className="font-medium">{item.name}</span>
                            {item.quantity > 1 && (
                                <span className="text-sm text-slate-500 ml-2">x{item.quantity}</span>
                            )}
                            <span className="text-xs text-slate-400 ml-2">({item.category})</span>
                        </div>
                        <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {(!inventory.items || inventory.items.length === 0) && (
                    <p className="text-sm text-slate-400 text-center py-4">No items added yet</p>
                )}
            </div>
        </div>
    );
};

// Medical Tab
const MedicalTab = ({ medical, setMedical }) => {
    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-600">
                Medical information helps generate appropriate emergency protocols and warnings.
            </p>

            {/* Allergies */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Allergies</label>
                <input
                    type="text"
                    placeholder="e.g., NSAIDs, penicillin (comma-separated)"
                    value={(medical.allergies || []).join(', ')}
                    onChange={(e) => setMedical({
                        ...medical,
                        allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Conditions */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Medical Conditions</label>
                <input
                    type="text"
                    placeholder="e.g., Diabetes, Asthma (comma-separated)"
                    value={(medical.conditions || []).join(', ')}
                    onChange={(e) => setMedical({
                        ...medical,
                        conditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Blood Type */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Blood Type</label>
                <select
                    value={medical.bloodType || ''}
                    onChange={(e) => setMedical({ ...medical, bloodType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Unknown</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                </select>
            </div>
        </div>
    );
};

// Location Tab
const LocationTab = ({ location, setLocation }) => {
    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-600">
                Location information helps generate route-specific evacuation plans.
            </p>

            {/* Home */}
            <div className="space-y-2">
                <h3 className="font-semibold text-sm">Home</h3>
                <input
                    type="text"
                    placeholder="Address"
                    value={location.home?.address || ''}
                    onChange={(e) => setLocation({
                        ...location,
                        home: { ...location.home, address: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="text"
                        placeholder="Postcode"
                        value={location.home?.postcode || ''}
                        onChange={(e) => setLocation({
                            ...location,
                            home: { ...location.home, postcode: e.target.value }
                        })}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="text"
                        placeholder="Floor (e.g., ground floor)"
                        value={location.home?.floor || ''}
                        onChange={(e) => setLocation({
                            ...location,
                            home: { ...location.home, floor: e.target.value }
                        })}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <input
                    type="text"
                    placeholder="Layout (e.g., 2-bed flat, terraced house)"
                    value={location.home?.layout || ''}
                    onChange={(e) => setLocation({
                        ...location,
                        home: { ...location.home, layout: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Work */}
            <div className="space-y-2">
                <h3 className="font-semibold text-sm">Work</h3>
                <input
                    type="text"
                    placeholder="Work address (optional)"
                    value={location.work?.address || ''}
                    onChange={(e) => setLocation({
                        ...location,
                        work: { ...location.work, address: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
        </div>
    );
};

// Resources Tab
const ResourcesTab = ({ resources, setResources }) => {
    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-600">
                Current resource levels help determine which actions are feasible.
            </p>

            {/* Water */}
            <div className="space-y-2">
                <h3 className="font-semibold text-sm">Water</h3>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">Bottled (liters)</label>
                        <input
                            type="number"
                            min="0"
                            value={resources.water?.bottled || 0}
                            onChange={(e) => setResources({
                                ...resources,
                                water: { ...resources.water, bottled: parseInt(e.target.value) || 0 }
                            })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">Stored (liters)</label>
                        <input
                            type="number"
                            min="0"
                            value={resources.water?.stored || 0}
                            onChange={(e) => setResources({
                                ...resources,
                                water: { ...resources.water, stored: parseInt(e.target.value) || 0 }
                            })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Food */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Food Supply (days)</label>
                <input
                    type="number"
                    min="0"
                    value={resources.food?.daysSupply || 0}
                    onChange={(e) => setResources({
                        ...resources,
                        food: { ...resources.food, daysSupply: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Cash */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cash on Hand (£)</label>
                <input
                    type="number"
                    min="0"
                    value={resources.cash || 0}
                    onChange={(e) => setResources({
                        ...resources,
                        cash: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
        </div>
    );
};

export default ContextSettings;
