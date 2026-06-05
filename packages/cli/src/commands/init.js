"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const constants_1 = require("../constants");
exports.initCommand = new commander_1.Command('init')
    .description('Initialize a new DFE project with recommended structure')
    .option('--prisma', 'Include Prisma adapter')
    .option('--drizzle', 'Include Drizzle adapter')
    .option('--express', 'Include Express route handlers')
    .option('-d, --dir <path>', 'Target directory', '.')
    .action(async (opts) => {
    const dir = (0, node_path_1.resolve)(opts.dir);
    console.log(chalk_1.default.blue('⚡ Initializing Dynamic Form Engine project...'));
    console.log();
    // Create directory structure
    const dirs = [
        'src',
        'src/forms',
    ];
    if (opts.express) {
        dirs.push('src/routes');
    }
    for (const d of dirs) {
        const fullPath = (0, node_path_1.join)(dir, d);
        if (!(0, node_fs_1.existsSync)(fullPath)) {
            (0, node_fs_1.mkdirSync)(fullPath, { recursive: true });
            console.log(chalk_1.default.green('  ✓'), `Created ${d}/`);
        }
    }
    // Generate package install instructions
    const packages = ['${ORG_SCOPE}/dfe-core'];
    if (opts.prisma)
        packages.push('${ORG_SCOPE}/dfe-prisma');
    if (opts.drizzle)
        packages.push('${ORG_SCOPE}/dfe-drizzle');
    if (opts.express) {
        packages.push('${ORG_SCOPE}/dfe-server');
        packages.push('${ORG_SCOPE}/dfe-express');
    }
    console.log();
    console.log(chalk_1.default.blue('📦 Install these packages:'));
    console.log();
    console.log(`  npm install ${packages.join(' ')}`);
    console.log();
    // Generate a sample form definition
    const sampleForm = `// src/forms/sample-form.ts
// Example form definition for the Dynamic Form Engine
import type { FormField, FormStep } from '${constants_1.ORG_SCOPE}/dfe-core'

export const sampleFields: FormField[] = [
  {
    id: 'field_name',
    versionId: 'v1',
    key: 'name',
    label: 'Full Name',
    type: 'SHORT_TEXT',
    required: true,
    order: 1,
    stepId: 'step1',
    config: { placeholder: 'Enter your full name' },
  },
  {
    id: 'field_email',
    versionId: 'v1',
    key: 'email',
    label: 'Email Address',
    type: 'EMAIL',
    required: true,
    order: 2,
    stepId: 'step1',
    config: { placeholder: 'you@example.com' },
  },
  {
    id: 'field_role',
    versionId: 'v1',
    key: 'role',
    label: 'Role',
    type: 'SELECT',
    required: true,
    order: 3,
    stepId: 'step2',
    config: {
      mode: 'static',
      options: [
        { label: 'Engineer', value: 'engineer' },
        { label: 'Designer', value: 'designer' },
        { label: 'Manager', value: 'manager' },
      ],
    },
  },
]

export const sampleSteps: FormStep[] = [
  {
    id: 'step1',
    versionId: 'v1',
    title: 'Personal Info',
    order: 1,
  },
  {
    id: 'step2',
    versionId: 'v1',
    title: 'Role Selection',
    order: 2,
  },
]
`;
    const formPath = (0, node_path_1.join)(dir, 'src/forms/sample-form.ts');
    if (!(0, node_fs_1.existsSync)(formPath)) {
        (0, node_fs_1.writeFileSync)(formPath, sampleForm);
        console.log(chalk_1.default.green('  ✓'), 'Created src/forms/sample-form.ts');
    }
    console.log();
    console.log(chalk_1.default.green('✅ DFE project initialized!'));
    console.log();
    console.log('Next steps:');
    console.log(`  1. Install packages: npm install ${packages.join(' ')}`);
    if (opts.prisma) {
        console.log('  2. Add Prisma schema: npx dfe add prisma-schema');
    }
    if (opts.drizzle) {
        console.log('  2. Add Drizzle schema: npx dfe add drizzle-schema');
    }
    if (opts.express) {
        console.log('  3. Add Express routes: npx dfe add be-utils');
    }
    console.log('  4. Add React hooks: npx dfe add fe-hooks');
    console.log();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImluaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEseUNBQW1DO0FBQ25DLGtEQUF5QjtBQUN6QixxQ0FBOEQ7QUFDOUQseUNBQXlDO0FBQ3pDLDRDQUF3QztBQUUzQixRQUFBLFdBQVcsR0FBRyxJQUFJLG1CQUFPLENBQUMsTUFBTSxDQUFDO0tBQzNDLFdBQVcsQ0FBQyx5REFBeUQsQ0FBQztLQUN0RSxNQUFNLENBQUMsVUFBVSxFQUFFLHdCQUF3QixDQUFDO0tBQzVDLE1BQU0sQ0FBQyxXQUFXLEVBQUUseUJBQXlCLENBQUM7S0FDOUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxnQ0FBZ0MsQ0FBQztLQUNyRCxNQUFNLENBQUMsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsR0FBRyxDQUFDO0tBQ25ELE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUU7SUFDckIsTUFBTSxHQUFHLEdBQUcsSUFBQSxtQkFBTyxFQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUM3QixPQUFPLENBQUMsR0FBRyxDQUFDLGVBQUssQ0FBQyxJQUFJLENBQUMsK0NBQStDLENBQUMsQ0FBQyxDQUFBO0lBQ3hFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQTtJQUViLDZCQUE2QjtJQUM3QixNQUFNLElBQUksR0FBRztRQUNYLEtBQUs7UUFDTCxXQUFXO0tBQ1osQ0FBQTtJQUVELElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUE7SUFDekIsQ0FBQztJQUVELEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7UUFDckIsTUFBTSxRQUFRLEdBQUcsSUFBQSxnQkFBSSxFQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUM3QixJQUFJLENBQUMsSUFBQSxvQkFBVSxFQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDMUIsSUFBQSxtQkFBUyxFQUFDLFFBQVEsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO1lBQ3hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDbEQsQ0FBQztJQUNILENBQUM7SUFFRCx3Q0FBd0M7SUFDeEMsTUFBTSxRQUFRLEdBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFBO0lBQ3BELElBQUksSUFBSSxDQUFDLE1BQU07UUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLENBQUE7SUFDekQsSUFBSSxJQUFJLENBQUMsT0FBTztRQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQTtJQUMzRCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixRQUFRLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLENBQUE7UUFDeEMsUUFBUSxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxDQUFBO0lBQzNDLENBQUM7SUFFRCxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUE7SUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLGVBQUssQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFBO0lBQ3JELE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQTtJQUNiLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ2xELE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQTtJQUViLG9DQUFvQztJQUNwQyxNQUFNLFVBQVUsR0FBRzs7NENBRXFCLHFCQUFTOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTJEcEQsQ0FBQTtJQUVHLE1BQU0sUUFBUSxHQUFHLElBQUEsZ0JBQUksRUFBQyxHQUFHLEVBQUUsMEJBQTBCLENBQUMsQ0FBQTtJQUN0RCxJQUFJLENBQUMsSUFBQSxvQkFBVSxFQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7UUFDMUIsSUFBQSx1QkFBYSxFQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQTtRQUNuQyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsa0NBQWtDLENBQUMsQ0FBQTtJQUNyRSxDQUFDO0lBRUQsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFBO0lBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFLLENBQUMsS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUMsQ0FBQTtJQUN0RCxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUE7SUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFBO0lBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0NBQXNDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ3ZFLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsbURBQW1ELENBQUMsQ0FBQTtJQUNsRSxDQUFDO0lBQ0QsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxREFBcUQsQ0FBQyxDQUFBO0lBQ3BFLENBQUM7SUFDRCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixPQUFPLENBQUMsR0FBRyxDQUFDLCtDQUErQyxDQUFDLENBQUE7SUFDOUQsQ0FBQztJQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsNENBQTRDLENBQUMsQ0FBQTtJQUN6RCxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUE7QUFDZixDQUFDLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1hbmQgfSBmcm9tICdjb21tYW5kZXInXG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnXG5pbXBvcnQgeyB3cml0ZUZpbGVTeW5jLCBta2RpclN5bmMsIGV4aXN0c1N5bmMgfSBmcm9tICdub2RlOmZzJ1xuaW1wb3J0IHsgam9pbiwgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCdcbmltcG9ydCB7IE9SR19TQ09QRSB9IGZyb20gJy4uL2NvbnN0YW50cydcblxuZXhwb3J0IGNvbnN0IGluaXRDb21tYW5kID0gbmV3IENvbW1hbmQoJ2luaXQnKVxuICAuZGVzY3JpcHRpb24oJ0luaXRpYWxpemUgYSBuZXcgREZFIHByb2plY3Qgd2l0aCByZWNvbW1lbmRlZCBzdHJ1Y3R1cmUnKVxuICAub3B0aW9uKCctLXByaXNtYScsICdJbmNsdWRlIFByaXNtYSBhZGFwdGVyJylcbiAgLm9wdGlvbignLS1kcml6emxlJywgJ0luY2x1ZGUgRHJpenpsZSBhZGFwdGVyJylcbiAgLm9wdGlvbignLS1leHByZXNzJywgJ0luY2x1ZGUgRXhwcmVzcyByb3V0ZSBoYW5kbGVycycpXG4gIC5vcHRpb24oJy1kLCAtLWRpciA8cGF0aD4nLCAnVGFyZ2V0IGRpcmVjdG9yeScsICcuJylcbiAgLmFjdGlvbihhc3luYyAob3B0cykgPT4ge1xuICAgIGNvbnN0IGRpciA9IHJlc29sdmUob3B0cy5kaXIpXG4gICAgY29uc29sZS5sb2coY2hhbGsuYmx1ZSgn4pqhIEluaXRpYWxpemluZyBEeW5hbWljIEZvcm0gRW5naW5lIHByb2plY3QuLi4nKSlcbiAgICBjb25zb2xlLmxvZygpXG5cbiAgICAvLyBDcmVhdGUgZGlyZWN0b3J5IHN0cnVjdHVyZVxuICAgIGNvbnN0IGRpcnMgPSBbXG4gICAgICAnc3JjJyxcbiAgICAgICdzcmMvZm9ybXMnLFxuICAgIF1cblxuICAgIGlmIChvcHRzLmV4cHJlc3MpIHtcbiAgICAgIGRpcnMucHVzaCgnc3JjL3JvdXRlcycpXG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBkIG9mIGRpcnMpIHtcbiAgICAgIGNvbnN0IGZ1bGxQYXRoID0gam9pbihkaXIsIGQpXG4gICAgICBpZiAoIWV4aXN0c1N5bmMoZnVsbFBhdGgpKSB7XG4gICAgICAgIG1rZGlyU3luYyhmdWxsUGF0aCwgeyByZWN1cnNpdmU6IHRydWUgfSlcbiAgICAgICAgY29uc29sZS5sb2coY2hhbGsuZ3JlZW4oJyAg4pyTJyksIGBDcmVhdGVkICR7ZH0vYClcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBHZW5lcmF0ZSBwYWNrYWdlIGluc3RhbGwgaW5zdHJ1Y3Rpb25zXG4gICAgY29uc3QgcGFja2FnZXM6IHN0cmluZ1tdID0gWycke09SR19TQ09QRX0vZGZlLWNvcmUnXVxuICAgIGlmIChvcHRzLnByaXNtYSkgcGFja2FnZXMucHVzaCgnJHtPUkdfU0NPUEV9L2RmZS1wcmlzbWEnKVxuICAgIGlmIChvcHRzLmRyaXp6bGUpIHBhY2thZ2VzLnB1c2goJyR7T1JHX1NDT1BFfS9kZmUtZHJpenpsZScpXG4gICAgaWYgKG9wdHMuZXhwcmVzcykge1xuICAgICAgcGFja2FnZXMucHVzaCgnJHtPUkdfU0NPUEV9L2RmZS1zZXJ2ZXInKVxuICAgICAgcGFja2FnZXMucHVzaCgnJHtPUkdfU0NPUEV9L2RmZS1leHByZXNzJylcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygpXG4gICAgY29uc29sZS5sb2coY2hhbGsuYmx1ZSgn8J+TpiBJbnN0YWxsIHRoZXNlIHBhY2thZ2VzOicpKVxuICAgIGNvbnNvbGUubG9nKClcbiAgICBjb25zb2xlLmxvZyhgICBucG0gaW5zdGFsbCAke3BhY2thZ2VzLmpvaW4oJyAnKX1gKVxuICAgIGNvbnNvbGUubG9nKClcblxuICAgIC8vIEdlbmVyYXRlIGEgc2FtcGxlIGZvcm0gZGVmaW5pdGlvblxuICAgIGNvbnN0IHNhbXBsZUZvcm0gPSBgLy8gc3JjL2Zvcm1zL3NhbXBsZS1mb3JtLnRzXG4vLyBFeGFtcGxlIGZvcm0gZGVmaW5pdGlvbiBmb3IgdGhlIER5bmFtaWMgRm9ybSBFbmdpbmVcbmltcG9ydCB0eXBlIHsgRm9ybUZpZWxkLCBGb3JtU3RlcCB9IGZyb20gJyR7T1JHX1NDT1BFfS9kZmUtY29yZSdcblxuZXhwb3J0IGNvbnN0IHNhbXBsZUZpZWxkczogRm9ybUZpZWxkW10gPSBbXG4gIHtcbiAgICBpZDogJ2ZpZWxkX25hbWUnLFxuICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICBrZXk6ICduYW1lJyxcbiAgICBsYWJlbDogJ0Z1bGwgTmFtZScsXG4gICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgIG9yZGVyOiAxLFxuICAgIHN0ZXBJZDogJ3N0ZXAxJyxcbiAgICBjb25maWc6IHsgcGxhY2Vob2xkZXI6ICdFbnRlciB5b3VyIGZ1bGwgbmFtZScgfSxcbiAgfSxcbiAge1xuICAgIGlkOiAnZmllbGRfZW1haWwnLFxuICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICBrZXk6ICdlbWFpbCcsXG4gICAgbGFiZWw6ICdFbWFpbCBBZGRyZXNzJyxcbiAgICB0eXBlOiAnRU1BSUwnLFxuICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgIG9yZGVyOiAyLFxuICAgIHN0ZXBJZDogJ3N0ZXAxJyxcbiAgICBjb25maWc6IHsgcGxhY2Vob2xkZXI6ICd5b3VAZXhhbXBsZS5jb20nIH0sXG4gIH0sXG4gIHtcbiAgICBpZDogJ2ZpZWxkX3JvbGUnLFxuICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICBrZXk6ICdyb2xlJyxcbiAgICBsYWJlbDogJ1JvbGUnLFxuICAgIHR5cGU6ICdTRUxFQ1QnLFxuICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgIG9yZGVyOiAzLFxuICAgIHN0ZXBJZDogJ3N0ZXAyJyxcbiAgICBjb25maWc6IHtcbiAgICAgIG1vZGU6ICdzdGF0aWMnLFxuICAgICAgb3B0aW9uczogW1xuICAgICAgICB7IGxhYmVsOiAnRW5naW5lZXInLCB2YWx1ZTogJ2VuZ2luZWVyJyB9LFxuICAgICAgICB7IGxhYmVsOiAnRGVzaWduZXInLCB2YWx1ZTogJ2Rlc2lnbmVyJyB9LFxuICAgICAgICB7IGxhYmVsOiAnTWFuYWdlcicsIHZhbHVlOiAnbWFuYWdlcicgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgfSxcbl1cblxuZXhwb3J0IGNvbnN0IHNhbXBsZVN0ZXBzOiBGb3JtU3RlcFtdID0gW1xuICB7XG4gICAgaWQ6ICdzdGVwMScsXG4gICAgdmVyc2lvbklkOiAndjEnLFxuICAgIHRpdGxlOiAnUGVyc29uYWwgSW5mbycsXG4gICAgb3JkZXI6IDEsXG4gIH0sXG4gIHtcbiAgICBpZDogJ3N0ZXAyJyxcbiAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgdGl0bGU6ICdSb2xlIFNlbGVjdGlvbicsXG4gICAgb3JkZXI6IDIsXG4gIH0sXG5dXG5gXG5cbiAgICBjb25zdCBmb3JtUGF0aCA9IGpvaW4oZGlyLCAnc3JjL2Zvcm1zL3NhbXBsZS1mb3JtLnRzJylcbiAgICBpZiAoIWV4aXN0c1N5bmMoZm9ybVBhdGgpKSB7XG4gICAgICB3cml0ZUZpbGVTeW5jKGZvcm1QYXRoLCBzYW1wbGVGb3JtKVxuICAgICAgY29uc29sZS5sb2coY2hhbGsuZ3JlZW4oJyAg4pyTJyksICdDcmVhdGVkIHNyYy9mb3Jtcy9zYW1wbGUtZm9ybS50cycpXG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coKVxuICAgIGNvbnNvbGUubG9nKGNoYWxrLmdyZWVuKCfinIUgREZFIHByb2plY3QgaW5pdGlhbGl6ZWQhJykpXG4gICAgY29uc29sZS5sb2coKVxuICAgIGNvbnNvbGUubG9nKCdOZXh0IHN0ZXBzOicpXG4gICAgY29uc29sZS5sb2coYCAgMS4gSW5zdGFsbCBwYWNrYWdlczogbnBtIGluc3RhbGwgJHtwYWNrYWdlcy5qb2luKCcgJyl9YClcbiAgICBpZiAob3B0cy5wcmlzbWEpIHtcbiAgICAgIGNvbnNvbGUubG9nKCcgIDIuIEFkZCBQcmlzbWEgc2NoZW1hOiBucHggZGZlIGFkZCBwcmlzbWEtc2NoZW1hJylcbiAgICB9XG4gICAgaWYgKG9wdHMuZHJpenpsZSkge1xuICAgICAgY29uc29sZS5sb2coJyAgMi4gQWRkIERyaXp6bGUgc2NoZW1hOiBucHggZGZlIGFkZCBkcml6emxlLXNjaGVtYScpXG4gICAgfVxuICAgIGlmIChvcHRzLmV4cHJlc3MpIHtcbiAgICAgIGNvbnNvbGUubG9nKCcgIDMuIEFkZCBFeHByZXNzIHJvdXRlczogbnB4IGRmZSBhZGQgYmUtdXRpbHMnKVxuICAgIH1cbiAgICBjb25zb2xlLmxvZygnICA0LiBBZGQgUmVhY3QgaG9va3M6IG5weCBkZmUgYWRkIGZlLWhvb2tzJylcbiAgICBjb25zb2xlLmxvZygpXG4gIH0pXG4iXX0=