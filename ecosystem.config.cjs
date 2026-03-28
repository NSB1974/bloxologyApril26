module.exports = {
	apps: [
		{
			name: 'bloxology',
			script: 'src/main.js',
			cwd: './apps/api',
			instances: 1,
			exec_mode: 'fork',
			watch: false,
			max_memory_restart: '512M',
			env_production: {
				NODE_ENV: 'production',
			},
		},
	],
};
