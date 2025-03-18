"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, SkipForward, MessageSquare, Video, CheckCircle2 } from "lucide-react"
import GuidanceSection from "@/components/GuidanceSection"

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState("guidance")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => setIsLoading(false), 1000)
  }, [])

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">AI Manager Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor loan applications</p>
        </div>
      </div>

      <Tabs defaultValue="guidance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="guidance" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Guidance Training
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Applications Review
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guidance" className="space-y-6">
          <GuidanceSection />
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Applications Review</CardTitle>
              <CardDescription>Review and process loan applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Applications review section coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 