"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Layout, Menu, Typography, ConfigProvider, theme as antdTheme, Button, Space } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  FileTextOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { adminMe } from "@/lib/admin-api";

const { Header, Sider, Content } = Layout;

const navItems = [
  { key: "/admin", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "/admin/courses", icon: <BookOutlined />, label: "Courses" },
  { key: "/admin/users", icon: <UserOutlined />, label: "Users" },
  { key: "/admin/logs", icon: <FileTextOutlined />, label: "Logs" },
  { key: "/admin/settings", icon: <SettingOutlined />, label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const selectedKeys = useMemo(() => {
    // Sort navItems by key length (longest first) to match most specific routes first
    const sortedNavItems = [...navItems].sort((a, b) => b.key.length - a.key.length);
    
    const found = sortedNavItems.find(i => {
      const exactMatch = pathname === i.key;
      const prefixMatch = pathname?.startsWith(i.key + "/");
      return exactMatch || prefixMatch;
    });
    
    return found ? [found.key] : ["/admin"];
  }, [pathname]);

  const isAuthRoute = pathname === "/admin/login";

  useEffect(() => {
    let mounted = true;
    const gate = async () => {
      if (isAuthRoute) {
        setAuthChecked(true);
        setIsAuthed(false);
        return;
      }
      try {
        const me = await adminMe();
        if (!mounted) return;
        if (me) {
          setIsAuthed(true);
        } else {
          setIsAuthed(false);
          router.replace("/admin/login");
        }
      } finally {
        if (mounted) setAuthChecked(true);
      }
    };
    gate();
    return () => {
      mounted = false;
    };
  }, [isAuthRoute, router]);

  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#7C3AED",
          colorInfo: "#7C3AED",
          colorBgLayout: "#f7f8fa",
          colorText: "#1b1b18",
          borderRadius: 10,
        },
      }}
    >
      {isAuthRoute ? (
        <div style={{ minHeight: "100vh", background: "#f7f8fa" }}>{children}</div>
      ) : !authChecked ? (
        <div style={{ minHeight: "100vh", background: "#f7f8fa" }} />
      ) : !isAuthed ? (
        <div style={{ minHeight: "100vh", background: "#f7f8fa" }} />
      ) : (
        <Layout style={{ minHeight: "100vh", background: "#f7f8fa" }}>
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            theme="light"
            style={{ background: "#ffffff", borderRight: "1px solid #f0f0f0" }}
          >
            <div style={{ padding: 16 }}>
              <Typography.Title level={5} style={{ color: "#1b1b18", margin: 0 }}>
                {collapsed ? "AL" : "AuraLearn Admin"}
              </Typography.Title>
            </div>
            <Menu
              theme="light"
              mode="inline"
              selectedKeys={selectedKeys}
              onClick={({ key }) => {
                router.push(String(key));
              }}
              items={navItems.map(i => ({ key: i.key, icon: i.icon, label: i.label }))}
              style={{ borderRight: 0 }}
            />
          </Sider>
          <Layout>
            <Header
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
                borderBottom: "1px solid #f0f0f0",
                paddingInline: 16,
              }}
            >
              <Typography.Text type="secondary" style={{ color: "#666" }}>
                Admin Panel
              </Typography.Text>
              <Space>
                <Button onClick={() => router.push("/")}>Back to site</Button>
              </Space>
            </Header>
            <Content style={{ margin: 16 }}>
              {children}
            </Content>
          </Layout>
        </Layout>
      )}
    </ConfigProvider>
  );
} 