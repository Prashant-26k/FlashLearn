export default function Modal({ isOpen, onClose, title, children, actions }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                {title && (
                    <h3 style={{
                        fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 16,
                        color: 'var(--text-primary)'
                    }}>
                        {title}
                    </h3>
                )}
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', marginBottom: 24 }}>
                    {children}
                </div>
                {actions && (
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
