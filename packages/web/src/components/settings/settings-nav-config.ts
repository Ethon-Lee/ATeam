export interface SettingsSection {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'members',
    label: '成员管理',
    icon: 'users',
    color: 'var(--color-opus-primary)',
    description: '成员名册、默认协作对象与编排顺序。',
  },
  {
    id: 'profiles',
    label: '猫猫画像',
    icon: 'file-text',
    color: 'var(--color-opus-primary)',
    description: '按模型分组的能力画像、路由信号与来源追溯。',
  },
  {
    id: 'accounts',
    label: '账户与密钥',
    icon: 'key',
    color: 'var(--color-opus-primary)',
    description: '模型账户、凭据和执行身份的归属关系。',
  },
  {
    id: 'skills',
    label: 'Skill 管理',
    icon: 'zap',
    color: 'var(--cafe-accent)',
    description: '已安装 Skill 的启停、挂载规则和本地预览。',
  },
  {
    id: 'mcp',
    label: 'MCP 管理',
    icon: 'box',
    color: 'var(--cafe-accent)',
    description: 'MCP 服务、工具目录和浏览器自动化依赖。',
  },
  {
    id: 'system',
    label: '系统配置',
    icon: 'settings',
    color: 'var(--color-gemini-primary)',
    description: '环境选项、默认行为和运行时总开关。',
  },
  {
    id: 'rules',
    label: '协作与规则',
    icon: 'file-text',
    color: 'var(--color-gemini-primary)',
    description: '会话生命周期、注入体系、协作规则与模型指南。',
  },
  {
    id: 'ops',
    label: '运维监控',
    icon: 'activity',
    color: 'var(--color-gemini-primary)',
    description: '服务健康、命令工具和运行态观测。',
  },
];

export const DEFAULT_SECTION = 'members';
