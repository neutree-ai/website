# Neutree 网站样式改造方案

基于 Figma 设计规范的分析和改造建议

## 📊 设计规范提取

### 1. 颜色系统 (Color System)

#### 主色调
- **主文本色**: `#0C2849` (深蓝灰色)
- **次要文本色**: 
  - `rgba(12, 40, 73, 0.8)` - 80% 透明度
  - `rgba(12, 40, 73, 0.6)` - 60% 透明度
  - `rgba(12, 40, 73, 0.5)` - 50% 透明度 (Footer)
- **背景色**:
  - `#FFFFFF` - 纯白
  - `rgba(12, 40, 73, 0.02)` - 极淡背景
  - `rgba(12, 40, 73, 0.05)` - Footer 背景
- **边框色**:
  - `rgba(12, 40, 73, 0.1)` - 主要边框
  - `rgba(12, 40, 73, 0.3)` - 按钮边框

#### 当前 vs 目标对比
| 元素 | 当前 | 目标 (Figma) |
|------|------|--------------|
| 主文本 | `#1a1a1a` | `#0C2849` |
| 次要文本 | `#6b7280` | `rgba(12, 40, 73, 0.8)` |
| 主色 | `#2563eb` (蓝色) | `#0C2849` (深蓝灰) |
| 背景 | `#ffffff` | `#ffffff` ✓ |
| 边框 | `#e5e7eb` | `rgba(12, 40, 73, 0.1)` |

### 2. 字体系统 (Typography)

#### 字体族
- **主字体**: `DM Sans` (标题和正文)
- **等宽字体**: `DM Mono` (代码和技术描述)

#### 字体大小层级
| 用途 | 大小 | 字重 | 行高 | 字间距 | 字体族 |
|------|------|------|------|--------|--------|
| Hero 主标题 | 72px | 600 | 1.302em | -3% | DM Sans |
| Hero 副标题 | 48px | 400 | 1.302em | -3% | DM Sans |
| Hero 描述 | 20px | 400 | 1.302em | -3% | DM Mono |
| Section 标题 | 32px | 600 | 1.302em | -3% | DM Sans |
| Section 小标题 | 20px | 600 | 1.302em | -3% | DM Sans |
| Feature 标题 | 24px | 500 | 1.302em | -6% | DM Mono |
| Feature 描述 | 16px | 400 | 1.302em | -6% | DM Mono |
| 按钮文字 | 16px | 500 | 1.2em | 0 | DM Sans |
| Footer 文字 | 14px | 400 | 1.2em | 0 | DM Sans |

#### 当前 vs 目标对比
- **当前**: Inter 字体
- **目标**: DM Sans + DM Mono
- **需要**: 更新 Google Fonts 链接

### 3. 间距系统 (Spacing)

#### Figma 间距值
```
8px, 10px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 60px, 64px, 80px, 160px
```

#### 主要间距用途
- **8px**: 元素内部小间距
- **12px**: 按钮内边距
- **16px**: 卡片内边距
- **20px**: 卡片内边距
- **24px**: 卡片内边距、导航间距
- **32px**: 大间距、Section 间距
- **40px**: 大间距
- **48px**: Footer 内边距
- **60px**: Section 间距
- **64px**: Footer 间距
- **80px**: 页面水平内边距
- **160px**: 页面顶部内边距

#### 当前 vs 目标对比
当前使用 rem 单位，需要转换为精确的 px 值或保持 rem 但调整比例。

### 4. 布局系统 (Layout)

#### 容器宽度
- **最大宽度**: 1280px ✓ (当前已匹配)
- **水平内边距**: 80px (桌面)
- **垂直内边距**: 160px (顶部)

#### 圆角
- **按钮/卡片**: 8px
- **当前**: 0.5rem (8px) ✓ 已匹配

### 5. 阴影系统 (Shadows)

#### 按钮阴影 (Primary Button)
```css
box-shadow: 
  0px 0.27px 2.35px 0px rgba(0, 0, 0, 0.02),
  0px 2.54px 8.36px 0px rgba(0, 0, 0, 0.04),
  0px 9.99px 23.33px 0px rgba(0, 0, 0, 0.05),
  0px 47px 80px 0px rgba(0, 0, 0, 0.07);
```

#### 按钮阴影 (Outlined Button)
```css
box-shadow: 
  0px 0.27px 2.35px 0px rgba(12, 40, 73, 0.02),
  0px 2.54px 8.36px 0px rgba(12, 40, 73, 0.04),
  0px 9.99px 23.33px 0px rgba(12, 40, 73, 0.05),
  0px 47px 80px 0px rgba(12, 40, 73, 0.07);
```

### 6. 组件样式

#### 按钮样式
- **Primary Button**: 
  - 背景: `#FFFFFF`
  - 文字: `#0C2849`
  - 内边距: `8px 12px`
  - 圆角: `8px`
  - 阴影: 多层阴影
  
- **Outlined Button**:
  - 背景: `#FFFFFF`
  - 边框: `1px solid rgba(12, 40, 73, 0.3)`
  - 文字: `#0C2849`
  - 内边距: `8px 12px`
  - 圆角: `8px`
  - 阴影: 多层阴影（带颜色）

#### Feature 卡片
- 边框: `1px solid rgba(12, 40, 73, 0.1)`
- 内边距: `20px 24px`
- 背景: `#FFFFFF`
- 布局: 网格布局，带图片区域

---

## 🎯 改造实施计划

### 阶段 1: 全局样式更新

#### 1.1 更新 Layout.astro
- [ ] 添加 DM Sans 和 DM Mono 字体
- [ ] 更新颜色变量系统
- [ ] 更新间距系统
- [ ] 添加阴影变量

#### 1.2 字体加载
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### 阶段 2: 组件样式更新

#### 2.1 Hero 组件
- [ ] 更新标题字体大小 (72px)
- [ ] 更新副标题字体大小 (48px)
- [ ] 更新描述字体 (DM Mono, 20px)
- [ ] 更新按钮样式
- [ ] 调整间距 (gap: 14px, padding: 12px 0px)

#### 2.2 Features 组件
- [ ] 更新卡片布局 (带图片区域)
- [ ] 更新标题字体 (DM Mono, 24px)
- [ ] 更新描述字体 (DM Mono, 16px)
- [ ] 更新边框样式
- [ ] 添加图片占位区域

#### 2.3 Header 组件
- [ ] 更新导航样式
- [ ] 调整内边距 (12px 80px)

#### 2.4 Footer 组件
- [ ] 更新背景色 `rgba(12, 40, 73, 0.05)`
- [ ] 更新文字颜色 `rgba(12, 40, 73, 0.5)`
- [ ] 调整内边距 (48px)

### 阶段 3: 响应式设计

#### 3.1 断点系统
基于 Figma 设计，建议断点：
- **Desktop**: ≥ 1280px (设计稿尺寸)
- **Tablet**: 768px - 1279px
- **Mobile**: < 768px

#### 3.2 响应式调整

**Hero 区域**
- Desktop: 72px 标题, 48px 副标题, 80px 水平内边距
- Tablet: 48px 标题, 32px 副标题, 40px 水平内边距
- Mobile: 36px 标题, 24px 副标题, 20px 水平内边距

**Features 区域**
- Desktop: 网格布局 (2列), 24px 标题
- Tablet: 网格布局 (2列), 20px 标题
- Mobile: 单列布局, 18px 标题

**间距调整**
- Desktop: 80px 水平内边距, 60px section 间距
- Tablet: 40px 水平内边距, 40px section 间距
- Mobile: 20px 水平内边距, 32px section 间距

**字体缩放**
- Desktop: 100% (基准)
- Tablet: 90% (标题缩小)
- Mobile: 80% (整体缩小)

---

## 📝 具体改造代码建议

### 全局样式变量更新

```css
:root {
  /* 颜色系统 - 基于 Figma */
  --color-text-primary: #0C2849;
  --color-text-secondary: rgba(12, 40, 73, 0.8);
  --color-text-tertiary: rgba(12, 40, 73, 0.6);
  --color-text-footer: rgba(12, 40, 73, 0.5);
  
  --color-bg: #FFFFFF;
  --color-bg-subtle: rgba(12, 40, 73, 0.02);
  --color-bg-footer: rgba(12, 40, 73, 0.05);
  
  --color-border: rgba(12, 40, 73, 0.1);
  --color-border-strong: rgba(12, 40, 73, 0.3);
  
  /* 字体系统 */
  --font-sans: "DM Sans", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: "DM Mono", "Courier New", monospace;
  
  /* 间距系统 - 精确值 */
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 20px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;
  --spacing-3xl: 40px;
  --spacing-4xl: 48px;
  --spacing-5xl: 60px;
  --spacing-6xl: 64px;
  --spacing-7xl: 80px;
  --spacing-hero-top: 160px;
  
  /* 字体大小 */
  --font-size-hero-title: 72px;
  --font-size-hero-subtitle: 48px;
  --font-size-hero-desc: 20px;
  --font-size-section-title: 32px;
  --font-size-section-subtitle: 20px;
  --font-size-feature-title: 24px;
  --font-size-feature-desc: 16px;
  --font-size-button: 16px;
  --font-size-footer: 14px;
  
  /* 行高 */
  --line-height-tight: 1.2;
  --line-height-normal: 1.302;
  
  /* 字间距 */
  --letter-spacing-tight: -0.03em; /* -3% */
  --letter-spacing-tighter: -0.06em; /* -6% */
  
  /* 阴影 */
  --shadow-button-primary: 
    0px 0.27px 2.35px 0px rgba(0, 0, 0, 0.02),
    0px 2.54px 8.36px 0px rgba(0, 0, 0, 0.04),
    0px 9.99px 23.33px 0px rgba(0, 0, 0, 0.05),
    0px 47px 80px 0px rgba(0, 0, 0, 0.07);
    
  --shadow-button-outlined: 
    0px 0.27px 2.35px 0px rgba(12, 40, 73, 0.02),
    0px 2.54px 8.36px 0px rgba(12, 40, 73, 0.04),
    0px 9.99px 23.33px 0px rgba(12, 40, 73, 0.05),
    0px 47px 80px 0px rgba(12, 40, 73, 0.07);
  
  /* 布局 */
  --max-width-content: 1280px;
  --padding-horizontal-desktop: 80px;
  --padding-horizontal-tablet: 40px;
  --padding-horizontal-mobile: 20px;
  --border-radius: 8px;
}
```

### 响应式媒体查询

```css
/* Tablet */
@media (max-width: 1279px) {
  :root {
    --font-size-hero-title: 48px;
    --font-size-hero-subtitle: 32px;
    --padding-horizontal: var(--padding-horizontal-tablet);
  }
}

/* Mobile */
@media (max-width: 767px) {
  :root {
    --font-size-hero-title: 36px;
    --font-size-hero-subtitle: 24px;
    --font-size-hero-desc: 18px;
    --font-size-section-title: 24px;
    --font-size-feature-title: 20px;
    --padding-horizontal: var(--padding-horizontal-mobile);
  }
}
```

---

## ✅ 检查清单

### 全局样式
- [ ] 更新字体为 DM Sans + DM Mono
- [ ] 更新颜色系统为 `#0C2849` 主色调
- [ ] 更新间距系统为精确 px 值
- [ ] 添加阴影变量
- [ ] 更新字体大小变量

### 组件更新
- [ ] Hero 组件样式更新
- [ ] Features 组件布局和样式更新
- [ ] Header 组件样式更新
- [ ] Footer 组件样式更新
- [ ] 按钮组件样式更新

### 响应式
- [ ] 添加断点系统
- [ ] 实现桌面端样式
- [ ] 实现平板端适配
- [ ] 实现移动端适配
- [ ] 测试各设备尺寸

### 细节优化
- [ ] 字间距调整 (-3%, -6%)
- [ ] 行高调整 (1.302em)
- [ ] 边框透明度调整
- [ ] 阴影效果实现
- [ ] 图片占位区域添加

---

## 🚀 下一步行动

1. **立即开始**: 更新 Layout.astro 的全局样式
2. **第二步**: 更新 Hero 组件
3. **第三步**: 更新 Features 组件
4. **第四步**: 更新其他组件
5. **最后**: 响应式优化和测试

