export default function GenerationLoader() {
    return (
        <div className="generation-loader" role="status" aria-live="polite">
            <div className="generation-loader-orbit">
                <span />
                <span />
                <span />
                <div className="generation-loader-core">✦</div>
            </div>
            <div>
                <h2>Building your flashcards</h2>
                <p>Reading your material and finding the key ideas...</p>
            </div>
            <div className="generation-loader-lines" aria-hidden="true">
                <span />
                <span />
                <span />
            </div>
        </div>
    );
}
