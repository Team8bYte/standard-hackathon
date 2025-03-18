import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import * as facialVerification from "@/lib/facial-verification"

type Registration = {
  id: string;
  userData: {
    applicantId: string;
    loanApplicationId: string;
    timestamp: string;
  };
  createdAt: string;
}

export default function AdminPortal() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRegistrations()
  }, [])

  const loadRegistrations = () => {
    try {
      setIsLoading(true)
      const storedFaces = facialVerification.listStoredFaces()
      setRegistrations(storedFaces)
    } catch (error) {
      console.error("Error loading registrations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRegistrations = registrations.filter(reg => 
    reg.userData.applicantId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.userData.loanApplicationId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Portal</h1>
          <p className="text-muted-foreground mt-1">View and manage all registered applications</p>
        </div>
        <Button onClick={loadRegistrations} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <input
          type="text"
          placeholder="Search by Applicant ID or Application ID..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Statistics */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <h3 className="text-2xl font-bold">{registrations.length}</h3>
              <p className="text-muted-foreground">Total Registrations</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                {registrations.filter(reg => new Date(reg.createdAt).toDateString() === new Date().toDateString()).length}
              </h3>
              <p className="text-muted-foreground">Today's Registrations</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                {registrations.filter(reg => 
                  new Date(reg.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length}
              </h3>
              <p className="text-muted-foreground">Last 7 Days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registrations List */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Applications</CardTitle>
          <CardDescription>
            Showing {filteredRegistrations.length} of {registrations.length} total registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading registrations...</p>
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No registrations found</p>
                </div>
              ) : (
                filteredRegistrations.map((reg) => (
                  <div key={reg.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">Applicant ID: {reg.userData.applicantId}</h3>
                        <p className="text-sm text-muted-foreground">Application ID: {reg.userData.loanApplicationId}</p>
                      </div>
                      <Badge>
                        {new Date(reg.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Registered: {new Date(reg.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
} 