<template>
  <div class="dashboard p-4">
    <!-- Top Summary Cards -->
    <el-row :gutter="20" class="mb-6">
      <el-col :span="6" :xs="12" :sm="12" :md="6">
        <el-card shadow="hover" class="metric-card bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-none">
          <div class="flex flex-col">
            <span class="text-sm opacity-80">总收入</span>
            <span class="text-2xl font-bold mt-2">¥125,430</span>
            <div class="mt-2 text-xs opacity-70 flex items-center">
              <span>+12.5%</span>
              <el-icon class="ml-1"><Top /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6" :xs="12" :sm="12" :md="6">
        <el-card shadow="hover" class="metric-card bg-gradient-to-br from-blue-400 to-cyan-500 text-white border-none">
          <div class="flex flex-col">
            <span class="text-sm opacity-80">新订单数</span>
            <span class="text-2xl font-bold mt-2">156</span>
            <div class="mt-2 text-xs opacity-70 flex items-center">
              <span>+5.2%</span>
              <el-icon class="ml-1"><Top /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6" :xs="12" :sm="12" :md="6">
        <el-card shadow="hover" class="metric-card bg-gradient-to-br from-emerald-400 to-teal-500 text-white border-none">
          <div class="flex flex-col">
            <span class="text-sm opacity-80">活跃用户数</span>
            <span class="text-2xl font-bold mt-2">3,200</span>
            <div class="mt-2 text-xs opacity-70 flex items-center">
              <span>+8.1%</span>
              <el-icon class="ml-1"><Top /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6" :xs="12" :sm="12" :md="6">
        <el-card shadow="hover" class="metric-card bg-gradient-to-br from-orange-400 to-amber-500 text-white border-none">
          <div class="flex flex-col">
            <span class="text-sm opacity-80">订单平均价值</span>
            <span class="text-2xl font-bold mt-2">¥804</span>
            <div class="mt-2 text-xs opacity-70 flex items-center">
              <span>-2.4%</span>
              <el-icon class="ml-1"><Bottom /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Section -->
    <el-row :gutter="20">
      <!-- Line Chart: Weekly Sales Trend -->
      <el-col :span="16" :xs="24" class="mb-4">
        <el-card shadow="never">
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-bold">每周销售趋势</span>
              <el-tag size="small" type="success">最近7天</el-tag>
            </div>
          </template>
          <div ref="lineChartRef" style="width: 100%; height: 400px;"></div>
        </el-card>
      </el-col>

      <!-- Pie Chart: Category Distribution -->
      <el-col :span="8" :xs="24">
        <el-card shadow="never">
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-bold">销售类别分布</span>
            </div>
          </template>
          <div ref="pieChartRef" style="width: 100%; height: 400px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { Top, Bottom } from '@element-plus/icons-vue';
import * as echarts from 'echarts';

// DOM References
const lineChartRef = ref<HTMLElement | null>(null);
const pieChartRef = ref<HTMLElement | null>(null);

// Chart Instances
let lineChartInstance: echarts.ECharts | null = null;
let pieChartInstance: echarts.ECharts | null = null;

const initLineChart = () => {
  if (!lineChartRef.value) return;
  lineChartInstance = echarts.init(lineChartRef.value);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
      {
        name: 'Sales',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgb(128, 255, 165)'
            },
            {
              offset: 1,
              color: 'rgb(1, 191, 236)'
            }
          ])
        },
        emphasis: {
          focus: 'series'
        },
        data: [140, 232, 101, 264, 90, 340, 250]
      },
      {
        name: 'Orders',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgb(0, 221, 255)'
            },
            {
              offset: 1,
              color: 'rgb(77, 119, 255)'
            }
          ])
        },
        emphasis: {
          focus: 'series'
        },
        data: [120, 282, 111, 234, 220, 340, 310]
      }
    ]
  };

  lineChartInstance.setOption(option);
};

const initPieChart = () => {
  if (!pieChartRef.value) return;
  pieChartInstance = echarts.init(pieChartRef.value);

  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      top: '5%',
      left: 'center'
    },
    series: [
      {
        name: 'Access From',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 1048, name: 'Electronics' },
          { value: 735, name: 'Fashion' },
          { value: 580, name: 'Home & Garden' },
          { value: 484, name: 'Sports' },
          { value: 300, name: 'Books' }
        ]
      }
    ]
  };

  pieChartInstance.setOption(option);
};

const handleResize = () => {
  lineChartInstance?.resize();
  pieChartInstance?.resize();
};

onMounted(() => {
  setTimeout(() => {
    initLineChart();
    initPieChart();
    window.addEventListener('resize', handleResize);
  }, 150);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  lineChartInstance?.dispose();
  pieChartInstance?.dispose();
});
</script>

<style scoped>
.metric-card {
  transition: transform 0.3s ease;
}
.metric-card:hover {
  transform: translateY(-5px);
}
</style>
