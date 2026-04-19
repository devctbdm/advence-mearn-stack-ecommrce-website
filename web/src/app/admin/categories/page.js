'use client';
import { categoriesAPI } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        order: 0,
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const res = await categoriesAPI.getAll();
            setCategories(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                order: category.order || 0,
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '', order: 0 });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingCategory) {
                await categoriesAPI.update(editingCategory._id, formData);
            } else {
                await categoriesAPI.create(formData);
            }
            setShowModal(false);
            loadCategories();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this category?')) return;
        try {
            await categoriesAPI.delete(id);
            loadCategories();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}>
            <div>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Categories
                    </h1>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Add Category
                    </button>
                </div>

                <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Order
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {categories.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-8 text-center text-gray-500">
                                            No categories found
                                        </td>
                                    </tr>
                                ) : (
                                    categories.map((category) => (
                                        <tr
                                            key={category._id}
                                            className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {category.order}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900 capitalize">
                                                {category.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {category.description}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() =>
                                                        openModal(category)
                                                    }
                                                    className="mr-2 inline-flex rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200">
                                                    <svg
                                                        className="h-4 w-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                                        />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(
                                                            category._id,
                                                        )
                                                    }
                                                    className="inline-flex rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200">
                                                    <svg
                                                        className="h-4 w-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                <AnimatePresence>
                    {showModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                            <div className="w-full max-w-md rounded-xl bg-white p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {editingCategory
                                            ? 'Edit Category'
                                            : 'Add Category'}
                                    </h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="text-gray-400 hover:text-gray-600">
                                        <svg
                                            className="h-6 w-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                })
                                            }
                                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    description: e.target.value,
                                                })
                                            }
                                            rows={3}
                                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Order
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.order}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    order:
                                                        parseInt(
                                                            e.target.value,
                                                        ) || 0,
                                                })
                                            }
                                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                                            {editingCategory ? 'Update' : 'Add'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
