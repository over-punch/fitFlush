// Placeholder landing page for fit-flush.com — full demo with sliders arrives next.

export default function Home() {
	return (
		<main
			style={{
				padding: '4rem 2rem',
				fontFamily: 'system-ui, sans-serif',
				maxWidth: '48rem',
				margin: '0 auto',
				lineHeight: 1.5,
			}}
		>
			<h1 style={{ fontSize: '3rem', margin: '0 0 1rem' }}>fit-flush</h1>
			<p style={{ margin: '0 0 1rem', opacity: 0.8 }}>
				Fit text size to its container with binary-search precision and
				variable-font safety.
			</p>
			<p style={{ margin: '0 0 2rem', opacity: 0.8 }}>Full demo coming soon.</p>
			<ul style={{ padding: 0, listStyle: 'none' }}>
				<li>
					<a href="https://github.com/Liiift-Studio/FitFlush">GitHub</a>
				</li>
				<li>
					<a href="https://www.npmjs.com/package/@liiift-studio/fit-flush">
						npm
					</a>
				</li>
			</ul>
		</main>
	)
}
