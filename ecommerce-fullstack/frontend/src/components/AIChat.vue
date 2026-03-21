<template>
  <section class="chat-shell flex h-[80vh] max-h-[800px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
    <header class="chat-header flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
      <div class="flex items-center gap-2.5">
        <div class="assistant-avatar assistant-avatar--header">
          <span class="text-base">AI</span>
        </div>
        <div>
          <h3 class="text-sm font-bold leading-tight text-slate-900">极简商城 · 智能导购</h3>
          <p class="mt-0.5 flex items-center text-[11px] text-emerald-500">
            <span class="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {{ isLoading ? 'AI 正在生成建议' : 'AI 助手在线' }}
          </p>
        </div>
      </div>
    </header>

    <div ref="messageListRef" class="chat-body flex-1 overflow-y-auto px-5 py-4">
      <div class="space-y-6">
        <div
          v-for="message in renderedMessages"
          :key="message.id"
          :class="['flex items-start', message.role === 'user' ? 'justify-end' : 'justify-start']"
        >
          <div
            v-if="message.role === 'assistant'"
            class="assistant-avatar mr-3 mt-1 flex-shrink-0"
          >
            <span>AI</span>
          </div>

          <article
            :class="[
              'message-bubble max-w-[82%] px-4 py-3 text-sm leading-7 shadow-sm',
              message.role === 'user'
                ? 'message-bubble--user'
                : 'message-bubble--assistant markdown-body',
            ]"
          >
            <template v-if="message.role === 'user'">
              {{ message.content }}
            </template>
            <template v-else>
              <div v-html="message.html" />
            </template>
          </article>

          <div
            v-if="message.role === 'user'"
            class="user-avatar ml-3 mt-1 flex-shrink-0"
          >
            <span>我</span>
          </div>
        </div>
      </div>
    </div>

    <footer class="chat-footer shrink-0 border-t border-slate-200 bg-white px-5 py-3">
      <div class="mx-auto flex max-w-4xl items-end gap-3">
        <div class="input-shell flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
          <el-input
            v-model="inputValue"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            :maxlength="1200"
            show-word-limit
            resize="none"
            :placeholder="inputPlaceholder"
            class="custom-textarea"
            @keydown="handleKeydown"
          />
        </div>

        <div class="action-row flex shrink-0 items-center gap-2 pb-1">
          <el-button
            text
            class="clear-button !m-0 !h-11 !rounded-xl !px-4 !text-sm !font-medium !text-slate-500 hover:!bg-slate-100 hover:!text-slate-700"
            :disabled="isLoading || messages.length === 0"
            @click="clearMessages"
          >
            清空对话
          </el-button>

          <el-button
            type="primary"
            :loading="isLoading"
            :disabled="!canSend"
            class="send-button !m-0 !h-11 !rounded-xl !border-0 !px-5"
            @click="sendMessage"
          >
            <svg
              v-if="!isLoading"
              xmlns="http://www.w3.org/2000/svg"
              class="mr-1 h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <span>{{ isLoading ? '发送中...' : '发送' }}</span>
          </el-button>
        </div>
      </div>

      <div class="mt-2 text-center text-[10px] text-slate-400">
        按 Enter 发送，Shift + Enter 换行 | 内容由 AI 生成，仅供购物参考
      </div>
    </footer>
  </section>
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import { ElMessage } from 'element-plus';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

interface StreamPayload {
  content?: string;
  message?: string;
}

interface RenderedChatMessage extends ChatMessage {
  html: string;
}

const props = withDefaults(
  defineProps<{
    presetPrompt?: string;
  }>(),
  {
    presetPrompt: '',
  },
);

const markdown = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
  typographer: true,
});

const inputValue = ref('');
const isLoading = ref(false);
const messages = ref<ChatMessage[]>([
  {
    id: createMessageId(),
    role: 'assistant',
    content:
      '你好，我是你的智能导购助手。\n\n- 可以告诉我你的预算、风格偏好、使用场景\n- 我会帮你推荐商品类别、搭配思路和购买建议',
  },
]);
const messageListRef = ref<HTMLElement | null>(null);

let currentAbortController: AbortController | null = null;

const canSend = computed(() => inputValue.value.trim().length > 0 && !isLoading.value);
const inputPlaceholder = computed(() =>
  props.presetPrompt?.trim() ||
  '告诉我想买什么，例如：预算 3000-4000 的高性价比手机...',
);

const renderedMessages = computed<RenderedChatMessage[]>(() =>
  messages.value.map((message) => ({
    ...message,
    html: sanitizeMarkdown(message.content),
  })),
);

watch(
  () => messages.value.map((message) => `${message.id}:${message.content.length}`).join('|'),
  async () => {
    await scrollToBottom();
  },
);

onMounted(() => {
  void scrollToBottom(false);
});

onBeforeUnmount(() => {
  currentAbortController?.abort();
});

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeMarkdown(content: string) {
  const rawHtml = markdown.render(content || '');
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
  });
}

async function scrollToBottom(smooth = true) {
  await nextTick();

  const container = messageListRef.value;
  if (!container) {
    return;
  }

  container.scrollTo({
    top: container.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto',
  });
}

function clearMessages() {
  currentAbortController?.abort();
  isLoading.value = false;
  messages.value = [];
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    void sendMessage();
  }
}

async function sendMessage() {
  const prompt = inputValue.value.trim();
  if (!prompt || isLoading.value) {
    return;
  }

  const userMessage: ChatMessage = {
    id: createMessageId(),
    role: 'user',
    content: prompt,
  };

  const assistantMessage: ChatMessage = {
    id: createMessageId(),
    role: 'assistant',
    content: '',
  };

  messages.value.push(userMessage, assistantMessage);
  const assistantMessageIndex = messages.value.length - 1;
  inputValue.value = '';
  isLoading.value = true;

  const abortController = new AbortController();
  currentAbortController = abortController;

  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages.value
          .filter((message) => message.id !== assistantMessage.id)
          .map(({ role, content }) => ({ role, content })),
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '智能导购服务请求失败');
    }

    if (!response.body) {
      throw new Error('浏览器不支持流式响应');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let streamFinished = false;

    while (!streamFinished) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() ?? '';

      for (const chunk of chunks) {
        const lines = chunk.split('\n');
        let eventName = 'message';

        for (const line of lines) {
          if (!line.trim()) {
            continue;
          }

          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
            continue;
          }

          if (!line.startsWith('data:')) {
            continue;
          }

          const data = line.slice(5).trim();

          if (data === '[DONE]') {
            streamFinished = true;
            break;
          }

          const payload = JSON.parse(data) as StreamPayload;

          if (eventName === 'error') {
            throw new Error(payload.message || '智能导购服务异常');
          }

          if (payload.content) {
            messages.value[assistantMessageIndex].content += payload.content;
            await scrollToBottom();
          }
        }
      }
    }

    if (!messages.value[assistantMessageIndex].content.trim()) {
      messages.value[assistantMessageIndex].content = '暂时没有生成内容，请稍后再试。';
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '发送消息失败，请稍后重试';

    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      messages.value[assistantMessageIndex].content =
        messages.value[assistantMessageIndex].content ||
        `抱歉，这次智能导购出现了一点问题。\n\n- ${message}`;
      ElMessage.error(message);
    }
  } finally {
    isLoading.value = false;
    if (currentAbortController === abortController) {
      currentAbortController = null;
    }
  }
}
</script>

<style scoped>
.chat-shell {
  min-height: 620px;
}

.chat-header {
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
}

.chat-footer {
  margin-top: auto;
}

.chat-body {
  scroll-behavior: smooth;
}

.assistant-avatar,
.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
}

.assistant-avatar {
  background: #dbeafe;
  color: #2563eb;
}

.assistant-avatar--header {
  width: 2.1rem;
  height: 2.1rem;
}

.user-avatar {
  background: #e2e8f0;
  color: #475569;
}

.message-bubble {
  border-radius: 1.1rem;
}

.message-bubble--assistant {
  border-top-left-radius: 0.3rem;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #1f2937;
}

.message-bubble--user {
  border-top-right-radius: 0.3rem;
  background: #2563eb;
  color: #fff;
}

.input-shell {
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
}

.action-row {
  min-width: 188px;
}

.send-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #2563eb !important;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.24);
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.send-button:hover {
  background: #1d4ed8 !important;
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.28);
}

.send-button:active {
  transform: scale(0.96);
}

.clear-button {
  min-width: 104px;
}

:deep(.custom-textarea .el-textarea__inner) {
  min-height: 52px !important;
  box-shadow: none !important;
  background: transparent !important;
  border: none !important;
  padding: 11px 14px;
  font-size: 14px;
  line-height: 1.5;
  color: #0f172a;
}

:deep(.custom-textarea .el-textarea__inner:focus) {
  box-shadow: none !important;
}

:deep(.custom-textarea .el-input__count) {
  background: transparent;
  color: #94a3b8;
}

.markdown-body :deep(*) {
  margin: 0;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  margin-top: 1em;
  margin-bottom: 0.45em;
  font-weight: 700;
  color: #111827;
}

.markdown-body :deep(p + p),
.markdown-body :deep(p + ul),
.markdown-body :deep(p + ol),
.markdown-body :deep(ul + p),
.markdown-body :deep(ol + p),
.markdown-body :deep(pre + p) {
  margin-top: 0.8em;
}

.markdown-body :deep(ul) {
  list-style-type: disc;
  padding-left: 1.5em;
  margin-top: 0.7em;
}

.markdown-body :deep(ol) {
  padding-left: 1.5em;
  margin-top: 0.7em;
}

.markdown-body :deep(li + li) {
  margin-top: 0.35em;
}

.markdown-body :deep(strong) {
  color: #111827;
}

.markdown-body :deep(a) {
  color: #2563eb;
  text-decoration: underline;
}

.markdown-body :deep(code) {
  border-radius: 6px;
  background: #eff6ff;
  padding: 0.12rem 0.35rem;
  color: #1d4ed8;
  font-size: 0.84em;
}

.markdown-body :deep(pre) {
  overflow-x: auto;
  margin-top: 0.85em;
  border-radius: 12px;
  background: #0f172a;
  padding: 0.9rem 1rem;
  color: #e2e8f0;
}

.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
}

@media (max-width: 640px) {
  .chat-shell {
    height: 100%;
    max-height: none;
    border-radius: 0;
  }
}
</style>
