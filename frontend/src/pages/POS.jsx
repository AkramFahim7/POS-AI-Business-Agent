import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { FiTrash2, FiPlus, FiMinus, FiSearch, FiPrinter, FiShoppingCart } from 'react-icons/fi';

const toCents = (amount) => Math.round((Number(amount) || 0) * 100);
const toMilliunits = (quantity) => Math.round((Number(quantity) || 0) * 1000);

const formatQuantity = (quantity, unit) => {
    const value = Number(quantity);
    if (unit === 'KG' || unit === 'L') return value.toFixed(3);
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(3);
};

const quickQuantitiesFor = (unit) => {
    const conversions = {
        KG: [['250g', 0.25], ['500g', 0.5], ['750g', 0.75], ['1KG', 1]],
        G: [['250g', 250], ['500g', 500], ['750g', 750], ['1KG', 1000]],
        L: [['250ml', 0.25], ['500ml', 0.5], ['750ml', 0.75], ['1L', 1]],
        ML: [['250ml', 250], ['500ml', 500], ['750ml', 750], ['1L', 1000]]
    };
    return (conversions[unit] || []).map(([label, quantity]) => ({ label, quantity }));
};

const formatMoney = (amount) => `Rs. ${Number(amount || 0).toFixed(2)}`;

const POS = () => {
    const { user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState([]);
    const [quantityDrafts, setQuantityDrafts] = useState({});
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    
    // Checkout state
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [cashReceived, setCashReceived] = useState('');
    const [discount, setDiscount] = useState(0);
    const [tax, setTax] = useState(0);
    
    // Receipt state
    const [receiptData, setReceiptData] = useState(null);

    const searchInputRef = useRef(null);

    useEffect(() => {
        fetchProducts();
        fetchCustomers();
    }, [search]);

    const fetchProducts = async () => {
        try {
            const res = await api.get(`/products?search=${search}&limit=50`);
            setProducts(res.data.data.filter(p => p.status === 'ACTIVE'));
        } catch (error) {
            console.error("Failed to fetch products", error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/customers');
            setCustomers(res.data.data);
        } catch (error) {
            console.error("Failed to fetch customers", error);
        }
    };

    const addToCart = (product) => {
        const quickQuantities = quickQuantitiesFor(product.unit);
        const quantityToAdd = product.product_type === 'COUNT' ? 1 : quickQuantities[0]?.quantity;
        if (!quantityToAdd) return alert('This product has an unsupported unit. Update its unit in Products first.');
        const existing = cart.find(item => item.product_id === product.id);
        if (existing) {
            const nextQuantity = (toMilliunits(existing.quantity) + toMilliunits(quantityToAdd)) / 1000;
            if (toMilliunits(nextQuantity) > toMilliunits(product.stock_quantity)) {
                alert(`Insufficient stock. Only ${product.stock_quantity} available.`);
                return;
            }
            setCart(cart.map(item => 
                item.product_id === product.id 
                ? { ...item, quantity: nextQuantity } 
                : item
            ));
        } else {
            if (product.stock_quantity <= 0) {
                alert('Out of stock!');
                return;
            }
            if (toMilliunits(quantityToAdd) > toMilliunits(product.stock_quantity)) {
                alert(`Insufficient stock. Only ${product.stock_quantity} ${product.unit} available.`);
                return;
            }
            setCart([...cart, { 
                product_id: product.id, 
                name: product.name, 
                price: parseFloat(product.selling_price),
                product_type: product.product_type,
                unit: product.unit,
                stock: product.stock_quantity,
                quantity: quantityToAdd
            }]);
        }
    };

    const setLineQuantity = (productId, quantity) => {
        const item = cart.find(cartItem => cartItem.product_id === productId);
        const milliunits = toMilliunits(quantity);
        if (!item || !Number.isFinite(Number(quantity)) || milliunits <= 0) return;
        if (item.product_type === 'COUNT' && milliunits % 1000 !== 0) {
            alert('Count products must be sold in whole quantities.');
            return;
        }
        if (milliunits > toMilliunits(item.stock)) {
            alert(`Insufficient stock. Only ${formatQuantity(item.stock, item.unit)} ${item.unit} available.`);
            return;
        }
        setCart(cart.map(cartItem => cartItem.product_id === productId
            ? { ...cartItem, quantity: milliunits / 1000 }
            : cartItem));
    };

    const handleQuantityDraftChange = (item, value) => {
        setQuantityDrafts(drafts => ({ ...drafts, [item.product_id]: value }));
        if (!/^\d*\.?\d{0,3}$/.test(value) || value === '' || value.endsWith('.')) return;
        const milliunits = toMilliunits(value);
        if (milliunits <= 0 || milliunits > toMilliunits(item.stock)) return;
        setCart(currentCart => currentCart.map(cartItem => cartItem.product_id === item.product_id
            ? { ...cartItem, quantity: milliunits / 1000 }
            : cartItem));
    };

    const finishQuantityDraft = (productId) => {
        setQuantityDrafts(drafts => {
            const nextDrafts = { ...drafts };
            delete nextDrafts[productId];
            return nextDrafts;
        });
    };

    const updateCountQuantity = (productId, delta) => {
        const item = cart.find(cartItem => cartItem.product_id === productId);
        if (item) setLineQuantity(productId, item.quantity + delta);
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    // Derived cart values
    const subtotalCents = cart.reduce((sum, item) => sum + Math.round((toCents(item.price) * toMilliunits(item.quantity)) / 1000), 0);
    const subtotal = subtotalCents / 100;
    const discountAmount = toCents(discount) / 100;
    const taxAmount = toCents(tax) / 100;
    const totalCents = subtotalCents - toCents(discount) + toCents(tax);
    const total = totalCents / 100;
    const cashReceivedCents = toCents(cashReceived);
    const cashIsInsufficient = paymentMethod === 'CASH' && cashReceivedCents < totalCents;
    const change = paymentMethod === 'CASH' ? Math.max(cashReceivedCents - totalCents, 0) / 100 : 0;

    const handleCheckout = async () => {
        if (cart.length === 0) return alert('Cart is empty');
        if (cashIsInsufficient) {
            return alert('Cash received is less than total amount');
        }

        try {
            const payload = {
                customer_id: selectedCustomer || null,
                cart_items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                })),
                payment_method: paymentMethod,
                cash_received: cashReceivedCents / 100,
                discount: discountAmount,
                tax: taxAmount
            };

            const res = await api.post('/sales', payload);
            
            // Show receipt
            setReceiptData({
                ...res.data.data,
                items: [...cart],
                subtotal, discount: discountAmount, tax: taxAmount, total,
                cashReceived: cashReceivedCents / 100, paymentMethod,
                change: Number(res.data.data.change ?? change),
                cashier: user.name,
                date: new Date().toLocaleString()
            });

            // Reset POS
            setCart([]);
            setCashReceived('');
            setIsCheckoutModalOpen(false);
            setSearch('');
            
        } catch (error) {
            alert(error.response?.data?.message || 'Checkout failed');
        }
    };

    const handlePrint = () => {
        window.print();
        setReceiptData(null); // Close receipt after printing dialog
    };

    if (receiptData) {
        return (
            <div className="bg-white p-8 max-w-md mx-auto shadow mt-10 text-center" id="receipt">
                <h2 className="text-2xl font-bold mb-2">MY POS SYSTEM</h2>
                <p className="mb-4 text-sm text-gray-500">Retail Store</p>
                <div className="text-left mb-4 text-sm border-b pb-2">
                    <p><strong>Invoice:</strong> {receiptData.invoice_number}</p>
                    <p><strong>Date:</strong> {receiptData.date}</p>
                    <p><strong>Cashier:</strong> {receiptData.cashier}</p>
                </div>
                <table className="w-full text-left mb-4 text-sm">
                    <thead>
                        <tr className="border-b">
                            <th>Product</th>
                            <th className="text-center">Qty / Unit</th>
                            <th className="text-right">Line Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {receiptData.items.map((item, idx) => (
                            <tr key={idx}>
                                <td>{item.name}</td>
                                <td className="text-center">{formatQuantity(item.quantity, item.unit)} {item.unit}</td>
                                <td className="text-right">{formatMoney(Math.round((toCents(item.price) * toMilliunits(item.quantity)) / 1000) / 100)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="text-right text-sm border-t pt-2 space-y-1">
                    <p>Subtotal: {formatMoney(receiptData.subtotal)}</p>
                    <p>Discount: {formatMoney(receiptData.discount)}</p>
                    <p>Tax: {formatMoney(receiptData.tax)}</p>
                    <p className="font-bold text-lg">TOTAL: {formatMoney(receiptData.total)}</p>
                    {receiptData.paymentMethod === 'CASH' && (
                        <>
                            <p>Cash: {formatMoney(receiptData.cashReceived)}</p>
                            <p>Change: {formatMoney(receiptData.change)}</p>
                        </>
                    )}
                    <p className="mt-2">Payment: {receiptData.paymentMethod}</p>
                </div>
                <div className="mt-6 font-bold text-lg">Thank You!</div>
                <div className="mt-8 no-print">
                    <button onClick={handlePrint} className="bg-primary text-white px-6 py-2 rounded flex items-center justify-center w-full mx-auto">
                        <FiPrinter className="mr-2" /> Print Receipt
                    </button>
                    <button onClick={() => setReceiptData(null)} className="mt-2 text-gray-500 underline w-full">Back to POS</button>
                </div>
                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        #receipt, #receipt * { visibility: visible; }
                        #receipt { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; margin: 0; }
                        .no-print { display: none; }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Products Section */}
            <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm p-4 h-full">
                <div className="relative mb-4">
                    <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    <input 
                        ref={searchInputRef}
                        type="text" 
                        placeholder="Search product by name, SKU or barcode..." 
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-primary"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.map(product => (
                            <div 
                                key={product.id} 
                                onClick={() => addToCart(product)}
                                className={`border rounded-lg p-3 cursor-pointer transition ${product.stock_quantity > 0 ? 'hover:border-primary hover:shadow-md bg-white' : 'bg-gray-100 opacity-60'}`}
                            >
                                <div className="font-semibold text-gray-800 truncate mb-1" title={product.name}>{product.name}</div>
                                <div className="text-primary font-bold mb-2">{formatMoney(product.selling_price)} / {product.unit}</div>
                                <div className="text-xs text-gray-500 flex justify-between">
                                    <span>{product.sku}</span>
                                    <span className={product.stock_quantity <= product.reorder_level ? 'text-red-500 font-bold' : ''}>
                                        Stock: {formatQuantity(product.stock_quantity, product.unit)} {product.unit}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {products.length === 0 && <p className="col-span-full text-center text-gray-500 mt-10">No products found</p>}
                    </div>
                </div>
            </div>

            {/* Cart Section */}
            <div className="w-full lg:w-96 flex flex-col bg-white rounded-lg shadow-sm">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center rounded-t-lg">
                    <h2 className="font-bold text-gray-800">Current Cart</h2>
                    <span className="bg-primary text-white text-xs px-2 py-1 rounded">{cart.length} items</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <FiShoppingCart size={48} className="mb-4 opacity-50" />
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cart.map(item => (
                                <div key={item.product_id} className="flex items-center justify-between p-3 border rounded bg-gray-50">
                                    <div className="flex-1">
                                        <div className="font-medium text-sm truncate w-32" title={item.name}>{item.name}</div>
                                        <div className="text-xs text-gray-500">{formatMoney(item.price)} / {item.unit}</div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {item.product_type === 'COUNT' ? (
                                            <>
                                                <button onClick={() => updateCountQuantity(item.product_id, -1)} className="p-1 bg-white border rounded hover:bg-gray-100" aria-label={`Remove one ${item.name}`}><FiMinus size={12}/></button>
                                                <span className="w-6 text-center text-sm font-medium">{formatQuantity(item.quantity, item.unit)}</span>
                                                <button onClick={() => updateCountQuantity(item.product_id, 1)} className="p-1 bg-white border rounded hover:bg-gray-100" aria-label={`Add one ${item.name}`}><FiPlus size={12}/></button>
                                            </>
                                        ) : (
                                            <div className="min-w-0">
                                                <input
                                                    aria-label={`Quantity in ${item.unit} for ${item.name}`}
                                                    type="number"
                                                    min="0.001"
                                                    max={item.stock}
                                                    step="0.001"
                                                    value={quantityDrafts[item.product_id] ?? item.quantity}
                                                    onChange={event => handleQuantityDraftChange(item, event.target.value)}
                                                    onBlur={() => finishQuantityDraft(item.product_id)}
                                                    className="w-24 text-right border rounded px-1"
                                                />
                                                <div className="flex flex-wrap justify-end gap-1 mt-1">
                                                    {quickQuantitiesFor(item.unit).map(option => (
                                                        <button
                                                            key={option.label}
                                                            type="button"
                                                            onClick={() => {
                                                                finishQuantityDraft(item.product_id);
                                                                setLineQuantity(item.product_id, option.quantity);
                                                            }}
                                                            disabled={toMilliunits(option.quantity) > toMilliunits(item.stock)}
                                                            className="px-1.5 py-0.5 border rounded text-xs hover:bg-blue-50 disabled:opacity-40"
                                                        >
                                                            {option.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-16 text-right font-semibold text-sm">
                                        {formatMoney(Math.round((toCents(item.price) * toMilliunits(item.quantity)) / 1000) / 100)}
                                    </div>
                                    <button onClick={() => removeFromCart(item.product_id)} className="ml-2 text-red-400 hover:text-red-600">
                                        <FiTrash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 rounded-b-lg">
                    <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-semibold">{formatMoney(subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Discount:</span>
                            <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} className="w-20 text-right border rounded px-1" />
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tax:</span>
                            <input type="number" min="0" value={tax} onChange={e => setTax(e.target.value)} className="w-20 text-right border rounded px-1" />
                        </div>
                        <div className="flex justify-between pt-2 border-t text-lg">
                            <span className="font-bold text-gray-800">Total:</span>
                            <span className="font-bold text-primary">{formatMoney(total)}</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsCheckoutModalOpen(true)}
                        disabled={cart.length === 0}
                        className={`w-full py-3 rounded font-bold text-lg transition ${cart.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary hover:bg-blue-800 text-white'}`}
                    >
                        COMPLETE SALE
                    </button>
                </div>
            </div>

            {/* Checkout Modal */}
            {isCheckoutModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-6 text-center">Checkout</h2>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Customer (Optional)</label>
                            <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="w-full border rounded p-2">
                                <option value="">Walk-in Customer</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Payment Method</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['CASH', 'CARD', 'BANK_TRANSFER', 'OTHER'].map(method => (
                                    <button 
                                        key={method} 
                                        onClick={() => setPaymentMethod(method)}
                                        className={`py-2 border rounded font-medium ${paymentMethod === method ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        {method.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {paymentMethod === 'CASH' && (
                            <div className="mb-4 bg-gray-50 p-4 rounded border">
                                <label className="block text-sm font-medium mb-1">Amount Received</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    min={total.toFixed(2)}
                                    value={cashReceived} 
                                    onChange={e => setCashReceived(e.target.value)} 
                                    className="w-full border rounded p-3 text-lg font-bold text-green-600 mb-2" 
                                    placeholder={total.toFixed(2)}
                                    aria-describedby="cash-payment-help"
                                />
                                <p id="cash-payment-help" className={`mb-2 text-sm ${cashIsInsufficient && cashReceived ? 'text-red-600' : 'text-gray-500'}`}>
                                    {cashIsInsufficient
                                        ? `Enter at least Rs. ${total.toFixed(2)} to enable payment.`
                                        : 'Enter the amount received from the customer.'}
                                </p>
                                <div className="flex justify-between text-lg">
                                    <span>Change:</span>
                                    <span className="font-bold text-red-500">Rs. {change > 0 ? change.toFixed(2) : '0.00'}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between border-t pt-4 mt-4">
                            <span className="text-xl font-bold">Total to Pay:</span>
                                    <span className="text-xl font-bold text-primary">{formatMoney(total)}</span>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button onClick={() => setIsCheckoutModalOpen(false)} className="flex-1 py-3 border rounded font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button 
                                onClick={handleCheckout} 
                                disabled={cashIsInsufficient}
                                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded font-bold disabled:opacity-50"
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;
