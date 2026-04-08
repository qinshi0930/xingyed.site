#!/bin/bash

# ==========================================
# Webhook 测试脚本
# 用于测试 webhook 服务是否正常运行
# ==========================================

# 配置
WEBHOOK_URL="${WEBHOOK_URL:-http://localhost:9000}"
HOOK_ID="${HOOK_ID:-deploy-xingyed-site}"
SECRET="${WEBHOOK_SECRET:-}"  # 从环境变量读取，如果有的话

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试计数
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 打印分隔线
print_separator() {
    echo -e "\n${BLUE}=========================================${NC}"
}

# 打印测试标题
print_test_title() {
    local test_num=$1
    local test_name=$2
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${BLUE}[测试 $test_num]${NC} $test_name"
    echo -e "${BLUE}-----------------------------------------${NC}"
}

# 打印成功消息
print_success() {
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✓ $1${NC}"
}

# 打印失败消息
print_failure() {
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo -e "${RED}✗ $1${NC}"
    if [ -n "$2" ]; then
        echo -e "${RED}  详情: $2${NC}"
    fi
}

# 打印信息
print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# ==========================================
# 开始测试
# ==========================================

print_separator
echo -e "${BLUE}Webhook 服务测试${NC}"
echo -e "${BLUE}目标: $WEBHOOK_URL/hooks/$HOOK_ID${NC}"
print_separator

# -----------------------------------------
# 测试 1: 服务连通性
# -----------------------------------------
print_test_title 1 "检查 webhook 服务是否运行"

if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEBHOOK_URL/hooks/$HOOK_ID" --max-time 5 2>&1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "服务可访问 (HTTP $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "000" ]; then
        print_failure "服务无法访问" "请检查 webhook 服务是否启动"
        echo -e "\n${RED}关键检查项:${NC}"
        echo "  1. 服务是否启动: systemctl status webhook"
        echo "  2. 端口是否监听: ss -tlnp | grep 9000"
        echo "  3. 防火墙规则: sudo ufw status | grep 9000"
        exit 1
    else
        print_success "服务可访问 (HTTP $HTTP_CODE)"
        print_info "响应码不是 200，可能是权限或配置问题"
    fi
else
    print_failure "未找到 curl 命令" "请先安装: sudo apt install curl"
    exit 1
fi

# -----------------------------------------
# 测试 2: 响应内容
# -----------------------------------------
print_test_title 2 "检查响应内容"

RESPONSE=$(curl -s "$WEBHOOK_URL/hooks/$HOOK_ID" --max-time 5 2>&1)

if echo "$RESPONSE" | grep -q "Deployment started!"; then
    print_success "响应内容正确: '$RESPONSE'"
else
    print_failure "响应内容不符合预期" "实际响应: '$RESPONSE'"
fi

# -----------------------------------------
# 测试 3: 响应头信息
# -----------------------------------------
print_test_title 3 "检查响应头"

HEADERS=$(curl -sI "$WEBHOOK_URL/hooks/$HOOK_ID" --max-time 5 2>&1)

if echo "$HEADERS" | grep -q "HTTP/1.1 200 OK"; then
    print_success "HTTP 状态码: 200 OK"
else
    print_failure "HTTP 状态码异常"
fi

if echo "$HEADERS" | grep -q "Content-Type"; then
    CONTENT_TYPE=$(echo "$HEADERS" | grep "Content-Type" | head -1)
    print_success "$CONTENT_TYPE"
else
    print_info "未找到 Content-Type 头"
fi

# -----------------------------------------
# 测试 4: 详细的 HTTP 请求信息
# -----------------------------------------
print_test_title 4 "详细的 HTTP 请求/响应信息"

VERBOSE_OUTPUT=$(curl -sv "$WEBHOOK_URL/hooks/$HOOK_ID" --max-time 5 2>&1)

if echo "$VERBOSE_OUTPUT" | grep -q "Connected to"; then
    CONNECTION_INFO=$(echo "$VERBOSE_OUTPUT" | grep "Connected to" | head -1)
    print_success "$CONNECTION_INFO"
else
    print_failure "无法获取连接信息"
fi

if echo "$VERBOSE_OUTPUT" | grep -q "< HTTP/1.1"; then
    HTTP_VERSION=$(echo "$VERBOSE_OUTPUT" | grep "< HTTP/1.1" | head -1)
    print_success "$HTTP_VERSION"
else
    print_failure "HTTP 版本信息异常"
fi

# -----------------------------------------
# 测试 5: 响应时间
# -----------------------------------------
print_test_title 5 "检查响应时间"

TIME_TOTAL=$(curl -s -o /dev/null -w "%{time_total}" "$WEBHOOK_URL/hooks/$HOOK_ID" --max-time 5 2>&1)

if [ -n "$TIME_TOTAL" ] && [ "$TIME_TOTAL" != "0.000000" ]; then
    print_success "响应时间: ${TIME_TOTAL}s"
    
    # 判断响应时间是否合理
    TIME_MS=$(echo "$TIME_TOTAL * 1000" | bc 2>/dev/null || echo "0")
    if [ "$(echo "$TIME_MS < 100" | bc 2>/dev/null || echo 0)" = "1" ]; then
        print_success "响应速度优秀 (< 100ms)"
    elif [ "$(echo "$TIME_MS < 500" | bc 2>/dev/null || echo 0)" = "1" ]; then
        print_success "响应速度良好 (< 500ms)"
    else
        print_info "响应时间较长 (> 500ms)，可能需要检查服务器性能"
    fi
else
    print_failure "无法获取响应时间"
fi

# -----------------------------------------
# 测试 6: HMAC 签名验证（如果配置了 secret）
# -----------------------------------------
print_test_title 6 "HMAC 签名验证测试"

if [ -n "$SECRET" ]; then
    print_info "使用配置的 Secret 进行签名测试"
    
    # 创建测试 payload
    PAYLOAD='{"ref":"refs/heads/main","head_commit":{"message":"Test commit"}}'
    
    # 生成 HMAC-SHA256 签名
    SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print "sha256="$2}')
    
    # 发送带签名的请求
    SIGNED_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "X-Hub-Signature-256: $SIGNATURE" \
        -d "$PAYLOAD" \
        "$WEBHOOK_URL/hooks/$HOOK_ID" \
        --max-time 5 2>&1)
    
    if [ "$SIGNED_RESPONSE" = "Deployment started!" ]; then
        print_success "HMAC 签名验证通过"
        print_success "带签名的 POST 请求成功"
    else
        print_failure "HMAC 签名验证失败" "响应: '$SIGNED_RESPONSE'"
        print_info "请检查 secret 是否正确配置"
    fi
else
    print_info "未配置 WEBHOOK_SECRET，跳过签名测试"
    print_info "如需测试签名验证，请设置环境变量:"
    echo "  export WEBHOOK_SECRET='your-secret-key'"
fi

# -----------------------------------------
# 测试 7: 模拟 GitHub Payload
# -----------------------------------------
print_test_title 7 "模拟 GitHub Webhook Payload"

GITHUB_PAYLOAD='{
  "ref": "refs/heads/main",
  "head_commit": {
    "message": "Test: webhook integration",
    "author": {
      "name": "Test User",
      "email": "test@example.com"
    }
  },
  "repository": {
    "name": "xingyed.site",
    "full_name": "qingshi0930/xingyed.site",
    "html_url": "https://github.com/qingshi0930/xingyed.site"
  }
}'

print_info "发送模拟的 GitHub push 事件..."

POST_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$GITHUB_PAYLOAD" \
    "$WEBHOOK_URL/hooks/$HOOK_ID" \
    --max-time 5 2>&1)

if [ "$POST_RESPONSE" = "Deployment started!" ]; then
    print_success "POST 请求成功"
    print_success "响应: '$POST_RESPONSE'"
else
    print_info "POST 请求响应: '$POST_RESPONSE'"
    print_info "如果没有配置 trigger-rule，这是正常的"
fi

# -----------------------------------------
# 测试总结
# -----------------------------------------
print_separator
echo -e "${BLUE}测试总结${NC}"
print_separator
echo -e "总测试数: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失败: ${RED}$FAILED_TESTS${NC}"
print_separator

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✓ 所有测试通过！Webhook 服务运行正常${NC}\n"
    exit 0
else
    echo -e "\n${RED}✗ 有 $FAILED_TESTS 个测试失败，请检查上述错误${NC}\n"
    exit 1
fi
