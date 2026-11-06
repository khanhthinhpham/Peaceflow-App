<template>
  <article class="lg-doc">
    <h1 class="lg-doc-title">{{ t('legal.pageTitle') }}</h1>
    <p class="lg-doc-meta">{{ t('legal.versionLine', { v: TERMS_VERSION, date: TERMS_EFFECTIVE_DATE }) }}</p>
    <p v-if="t('legal.officialNote')" class="lg-doc-note">{{ t('legal.officialNote') }}</p>

    <nav class="lg-toc" :aria-label="t('legal.toc')">
      <p class="lg-toc-title">{{ t('legal.toc') }}</p>
      <ol>
        <li v-for="a in TERMS_ARTICLES" :key="a.n">
          <a :href="`#dieu-${a.n}`" @click.prevent="scrollTo(a.n)">{{ t('legal.article', { n: a.n }) }}. {{ a.title }}</a>
        </li>
      </ol>
    </nav>

    <!-- Văn bản pháp lý chỉ có bản tiếng Việt (bản có giá trị pháp lý) -->
    <section v-for="a in TERMS_ARTICLES" :id="`dieu-${a.n}`" :key="a.n" class="lg-art" lang="vi">
      <h2>Điều {{ a.n }}. {{ a.title }}</h2>
      <p v-if="a.intro">{{ a.intro }}</p>
      <ol>
        <li v-for="(it, i) in a.items" :key="i">
          <template v-if="typeof it === 'string'">{{ it }}</template>
          <template v-else>
            {{ it.text }}
            <ul><li v-for="(s, j) in it.sub" :key="j">{{ s }}</li></ul>
          </template>
        </li>
      </ol>
    </section>
  </article>
</template>

<script setup>
import { onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { TERMS_ARTICLES, TERMS_VERSION, TERMS_EFFECTIVE_DATE } from '../../lib/legalTerms';

const props = defineProps({ article: { type: Number, default: null } });
const { t } = useI18n();

function scrollTo(n) {
  document.getElementById(`dieu-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
onMounted(() => { if (props.article) nextTick(() => scrollTo(props.article)); });
defineExpose({ scrollTo });
</script>
