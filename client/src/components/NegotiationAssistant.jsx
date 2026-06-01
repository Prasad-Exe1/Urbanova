import { useState } from 'react';
import { DollarSign, TrendingUp, Target, X, MessageSquare, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function NegotiationAssistant({ property, isOpen, onClose }) {
    const [offerPrice, setOfferPrice] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const price = property?.price || 0;
    const suggestedMin = Math.floor(price * 0.85);
    const suggestedMax = Math.floor(price * 0.95);
    const marketValue = price;

    const analyzeOffer = async () => {
        if (!offerPrice) return;
        setLoading(true);
        setError(null);
        
        try {
            const offer = parseInt(offerPrice);
            
            const res = await fetch('/api/ai/negotiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ property, offerPrice: offer })
            });

            const data = await res.json();
            
            if (!res.ok)
                throw new Error(
                    data.error ||
                        data.message ||
                        (res.status === 503 ? 'AI is offline — OPENROUTER_API_KEY not configured on server.' : 'Failed to analyze offer')
                );

            setAnalysis({
                offer,
                probability: data.probability,
                discountPercent: ((marketValue - offer) / marketValue * 100).toFixed(1),
                strategy: data.strategy,
                counterOffer: data.counterOffer,
                script: data.script,
                suggestedRange: { min: suggestedMin, max: suggestedMax }
            });
            
        } catch (err) {
            console.error(err);
            setError("The AI assistant is currently unavailable. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <motion.div 
                className="auth-modal liquid-glass"
                style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                            background: 'linear-gradient(135deg, #f2ca50 0%, #d4af37 100%)',
                            padding: '0.75rem', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Target size={24} color="#003732" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', textAlign: 'left' }}>AI Negotiation Assistant</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'left' }}>Powered by OpenRouter</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', padding: '0.5rem', boxShadow: 'none' }}>
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                {!analysis ? (
                    <>
                        <div style={{ 
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border)',
                            padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem',
                        }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
                                <TrendingUp size={18} /> Market Analysis
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Listed Price: <strong style={{ color: '#fff' }}>₹{marketValue.toLocaleString()}</strong>
                            </p>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Recommended Range: <strong style={{ color: '#fff' }}>₹{suggestedMin.toLocaleString()} - ₹{suggestedMax.toLocaleString()}</strong>
                            </p>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)', textAlign: 'left' }}>
                                Enter Your Offer Price (₹)
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input 
                                    type="number" 
                                    value={offerPrice}
                                    onChange={(e) => setOfferPrice(e.target.value)}
                                    placeholder={`e.g., ${suggestedMin.toLocaleString()}`}
                                    style={{ flex: 1, padding: '1rem', fontSize: '1rem', background: 'rgba(0,0,0,0.3)' }}
                                />
                                <button 
                                    onClick={analyzeOffer}
                                    disabled={loading || !offerPrice}
                                    style={{ 
                                        padding: '0 1.5rem', 
                                        background: 'var(--accent)',
                                        color: '#000',
                                        whiteSpace: 'nowrap',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Analyze'}
                                </button>
                            </div>
                        </div>

                        <div style={{ 
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
                            background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <DollarSign size={20} color="var(--accent)" />
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Minimum</p>
                                <p style={{ margin: 0, fontWeight: '600' }}>₹{suggestedMin.toLocaleString()}</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <DollarSign size={20} color="#f5576c" />
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Maximum</p>
                                <p style={{ margin: 0, fontWeight: '600' }}>₹{suggestedMax.toLocaleString()}</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <AnimatePresence>
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ textAlign: 'left' }}
                        >
                            <div style={{ 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: '2rem', borderRadius: '12px', marginBottom: '1.5rem',
                                background: analysis.probability >= 70 ? 'rgba(34,197,94,0.1)' :
                                           analysis.probability >= 40 ? 'rgba(212,175,55,0.1)' :
                                           'rgba(239,68,68,0.1)',
                                border: `1px solid ${analysis.probability >= 70 ? '#22c55e' : analysis.probability >= 40 ? 'var(--accent)' : '#ef4444'}`
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)' }}>AI Probability Score</p>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '3rem', fontWeight: '800', color: analysis.probability >= 70 ? '#22c55e' : analysis.probability >= 40 ? 'var(--accent)' : '#ef4444' }}>
                                        {analysis.probability}%
                                    </p>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Your Offer Breakdown</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                    <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Your Offer</p>
                                        <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600' }}>₹{analysis.offer.toLocaleString()}</p>
                                    </div>
                                    <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Discount</p>
                                        <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', color: analysis.discountPercent > 0 ? '#22c55e' : '#ef4444' }}>
                                            {analysis.discountPercent}%
                                        </p>
                                    </div>
                                    <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Listed Price</p>
                                        <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600' }}>₹{marketValue.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.3)', marginBottom: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
                                    💡 AI Strategy
                                </h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{analysis.strategy}</p>
                            </div>

                            {analysis.counterOffer && (
                                <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.3)', marginBottom: '1.5rem' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e' }}>
                                        🤝 Expected Counter
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                        Seller might counter around <strong>₹{analysis.counterOffer.toLocaleString()}</strong>
                                    </p>
                                </div>
                            )}

                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MessageSquare size={18} color="var(--accent)" /> AI Script
                                </h4>
                                <div style={{ 
                                    padding: '1rem', borderRadius: '8px', 
                                    background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                                    fontStyle: 'italic', fontSize: '0.9rem', lineHeight: '1.6'
                                }}>
                                    "{analysis.script}"
                                </div>
                            </div>

                            <button 
                                onClick={() => setAnalysis(null)}
                                style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                            >
                                Try Another Offer
                            </button>
                        </motion.div>
                    </AnimatePresence>
                )}
            </motion.div>
        </div>
    );
}

export default NegotiationAssistant;