import pc from 'picocolors';

export function printBanner() {
  const banner = `
${pc.bold(pc.cyan('  ╔═══════════════════════════════════════════════╗'))}
${pc.bold(pc.cyan('  ║'))}${pc.bold(pc.white('          ⚡  create-arc-express  ⚡           '))}${pc.bold(pc.cyan('║'))}
${pc.bold(pc.cyan('  ║'))}${pc.dim('     Production-ready Express.js backends     ')}${pc.bold(pc.cyan('║'))}
${pc.bold(pc.cyan('  ╚═══════════════════════════════════════════════╝'))}
`;
  console.log(banner);
}

export function printSuccess(projectName, context) {
  const lines = [
    '',
    pc.bold(pc.green('  ✔ Project scaffolded successfully!')),
    '',
    pc.dim('  Next steps:'),
    '',
    pc.cyan(`    cd ${projectName}`),
    pc.cyan('    npm install'),
  ];

  if (context.features.database && context.orm === 'prisma') {
    lines.push(pc.cyan('    npx prisma generate'));
  }

  lines.push(pc.cyan('    npm run dev'));
  lines.push('');

  const features = Object.entries(context.features)
    .filter(([, v]) => v)
    .map(([k]) => k);

  if (features.length) {
    lines.push(pc.dim('  Features included:'));
    features.forEach(f => {
      lines.push(pc.green(`    ◼ ${formatFeatureName(f)}`));
    });
    lines.push('');
  }

  lines.push(pc.dim('  Happy coding! 🚀'));
  lines.push('');

  console.log(lines.join('\n'));
}

function formatFeatureName(key) {
  const names = {
    auth: 'Authentication',
    database: 'Database (ORM)',
    oauth: 'Google OAuth SSO',
    email: 'Email (SMTP)',
    fileUpload: 'File Upload (Cloudinary)',
    csrf: 'CSRF Protection',
    audit: 'Audit Logging',
    docker: 'Docker Compose',
    testing: 'Testing (Vitest)',
    githubActions: 'GitHub Actions CI',
  };
  return names[key] || key;
}
