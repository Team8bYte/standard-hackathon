import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, User, Calendar, CheckCircle2, XCircle } from "lucide-react"

type ApplicationStatus = "draft" | "submitted" | "approved" | "rejected"

interface ApplicationData {
  id: string
  applicantId: string
  personalInfo: {
    fullName: string
    aadhaarNumber: string
    panNumber: string
    dateOfBirth: string
    gender: string
    address: string
  }
  financialInfo: Array<{
    question: string
    answer: string
  }>
  documents: Array<{
    type: string
    name: string
    status: string
  }>
  status: ApplicationStatus
  submittedAt?: string
}

export default function AdminPortal() {
  const [applications, setApplications] = useState<ApplicationData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = () => {
    try {
      setIsLoading(true)
      const savedApplications = localStorage.getItem("submittedApplications")
      if (savedApplications) {
        setApplications(JSON.parse(savedApplications))
      }
    } catch (error) {
      console.error("Error loading applications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadgeColor = (status: ApplicationStatus) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleStatusChange = (applicationId: string, newStatus: ApplicationStatus) => {
    const updatedApplications = applications.map(app => 
      app.id === applicationId ? { ...app, status: newStatus } : app
    )
    setApplications(updatedApplications)
    localStorage.setItem("submittedApplications", JSON.stringify(updatedApplications))
  }

  const filteredApplications = applications.filter(app => 
    app.personalInfo.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.applicantId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Portal</h1>
          <p className="text-muted-foreground mt-1">Manage and review loan applications</p>
        </div>
        <Button onClick={loadApplications} variant="outline">
          Refresh Applications
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <input
          type="text"
          placeholder="Search by name, application ID, or applicant ID..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Statistics */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <h3 className="text-2xl font-bold">{applications.length}</h3>
              <p className="text-muted-foreground">Total Applications</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                {applications.filter(app => app.status === "submitted").length}
              </h3>
              <p className="text-muted-foreground">Pending Review</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                {applications.filter(app => app.status === "approved").length}
              </h3>
              <p className="text-muted-foreground">Approved</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                {applications.filter(app => app.status === "rejected").length}
              </h3>
              <p className="text-muted-foreground">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Applications</CardTitle>
          <CardDescription>
            Showing {filteredApplications.length} of {applications.length} total applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading applications...</p>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No applications found</p>
                </div>
              ) : (
                filteredApplications.map((app) => (
                  <div key={app.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {app.personalInfo.fullName}
                        </h3>
                        <div className="text-sm text-muted-foreground space-y-1 mt-1">
                          <p>Application ID: {app.id}</p>
                          <p>Applicant ID: {app.applicantId}</p>
                        </div>
                      </div>
                      <Badge className={getStatusBadgeColor(app.status)}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Personal Information
                        </h4>
                        <div className="text-sm space-y-1 text-muted-foreground">
                          <p>Aadhaar: {app.personalInfo.aadhaarNumber}</p>
                          <p>PAN: {app.personalInfo.panNumber}</p>
                          <p>Gender: {app.personalInfo.gender}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Application Timeline
                        </h4>
                        <div className="text-sm space-y-1 text-muted-foreground">
                          <p>Submitted: {new Date(app.submittedAt || "").toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {app.status === "submitted" && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => handleStatusChange(app.id, "approved")}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex items-center gap-2"
                          onClick={() => handleStatusChange(app.id, "rejected")}
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
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