import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Navbar from '../../components/Navbar';
import { io } from 'socket.io-client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2';
import { 
  Award, Calendar, Bell, 
  Send, CheckCircle2, AlertCircle, TrendingUp,
  Check, MessageSquare, CornerDownRight, Sparkles, Clock, BookOpen
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const ParentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedTermFilter, setSelectedTermFilter] = useState('All');

  // Leave Form State
  const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Concern Form State
  const [classTeachers, setClassTeachers] = useState([]);
  const [concernForm, setConcernForm] = useState({ targetTeacherId: '', subject: '', message: '' });

  useEffect(() => {
    fetchParentDashboard();
  }, [selectedStudentId]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchClassTeachers(selectedStudentId);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    socket.on('new_announcement', (announcement) => {
      setLiveAlerts((prev) => [`Notice: ${announcement.title}`, ...prev]);
      fetchParentDashboard();
    });

    socket.on('exam_timetable_updated', (data) => {
      setLiveAlerts((prev) => [data.message || 'Exam timetable updated!', ...prev]);
      fetchParentDashboard();
    });

    if (selectedStudentId) {
      socket.on(`marks_updated_${selectedStudentId}`, (data) => {
        setLiveAlerts((prev) => [data.message || 'New grades recorded!', ...prev]);
        fetchParentDashboard();
      });

      socket.on(`leave_status_updated_${selectedStudentId}`, (data) => {
        setLiveAlerts((prev) => [data.message || 'Leave status updated!', ...prev]);
        fetchParentDashboard();
      });

      socket.on(`concern_replied_${selectedStudentId}`, (data) => {
        setLiveAlerts((prev) => [data.message || 'Teacher replied to your query!', ...prev]);
        fetchParentDashboard();
      });
    }

    return () => socket.disconnect();
  }, [selectedStudentId]);

  const fetchParentDashboard = async () => {
    try {
      const url = selectedStudentId 
        ? `/parent/dashboard?studentId=${selectedStudentId}` 
        : '/parent/dashboard';
      const res = await axiosClient.get(url);
      setDashboardData(res.data);

      if (!selectedStudentId && res.data?.allLinkedChildren?.length > 0) {
        setSelectedStudentId(res.data.activeStudent?._id || res.data.allLinkedChildren[0]._id);
      }
    } catch (err) {
      console.error('Failed to load parent dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClassTeachers = async (studentId) => {
    try {
      const res = await axiosClient.get(`/parent/teachers/${studentId}`);
      setClassTeachers(res.data?.teachers || []);
    } catch (err) {
      console.error('Failed to load teachers for student:', err);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/parent/leave-request', {
        studentId: selectedStudentId,
        ...leaveForm
      });
      setStatusMsg({ type: 'success', text: 'Leave application submitted to class teacher!' });
      setLeaveForm({ startDate: '', endDate: '', reason: '' });
      fetchParentDashboard();
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      setStatusMsg({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to submit leave application.' 
      });
    }
  };

  const handleConcernSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/parent/concern', {
        studentId: selectedStudentId,
        ...concernForm
      });
      setStatusMsg({ type: 'success', text: 'Query sent directly to the teacher!' });
      setConcernForm({ targetTeacherId: '', subject: '', message: '' });
      fetchParentDashboard();
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit query.'
      });
    }
  };

  const handleAcknowledgeNotice = async (announcementId) => {
    try {
      await axiosClient.post(`/parent/announcement/${announcementId}/acknowledge`);
      setStatusMsg({ type: 'success', text: 'Notice acknowledged (read receipt saved)!' });
      fetchParentDashboard();
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-9 h-9 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Student Records...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentStudent = dashboardData?.activeStudent;
  const allChildren = dashboardData?.allLinkedChildren || [];
  const marks = dashboardData?.academicSummary?.marks || [];
  const attendanceHistory = dashboardData?.attendanceHistory || [];
  const announcements = dashboardData?.announcements || [];
  const concerns = dashboardData?.concerns || [];
  const exams = dashboardData?.exams || [];
  const academicSummary = dashboardData?.academicSummary || {
    attendancePercentage: '100.0',
    totalClassesLogged: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0
  };

  const termsList = Array.from(new Set(marks.map((m) => m.term)));
  const filteredMarks = selectedTermFilter === 'All'
    ? marks
    : marks.filter((m) => m.term === selectedTermFilter);

  const averageScore = marks.length > 0
    ? (marks.reduce((acc, curr) => acc + (curr.obtainedMarks / curr.maxMarks) * 100, 0) / marks.length).toFixed(1)
    : 'N/A';

  // Chart 1: Line Chart
  const termPerformanceMap = {};
  marks.forEach((m) => {
    if (!termPerformanceMap[m.term]) termPerformanceMap[m.term] = { total: 0, max: 0 };
    termPerformanceMap[m.term].total += m.obtainedMarks;
    termPerformanceMap[m.term].max += m.maxMarks;
  });
  const termLabels = Object.keys(termPerformanceMap);
  const termGrowthChartData = {
    labels: termLabels.length > 0 ? termLabels : ['No Terms Yet'],
    datasets: [{
      label: 'Overall Term Performance (%)',
      data: termLabels.length > 0 
        ? termLabels.map((t) => {
            const item = termPerformanceMap[t];
            return item.max > 0 ? ((item.total / item.max) * 100).toFixed(1) : 0;
          })
        : [0],
      borderColor: '#4f46e5',
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      fill: true,
      tension: 0.35
    }]
  };

  // Chart 2: Comparative Bar Chart
  const uniqueSubjects = Array.from(new Set(marks.map((m) => m.subject)));
  const previousTerm = termsList[1] || null;
  const currentTerm = termsList[0] || null;
  const comparativeBarChartData = {
    labels: uniqueSubjects.length > 0 ? uniqueSubjects : ['No Subjects'],
    datasets: [
      {
        label: previousTerm ? `Previous (${previousTerm})` : 'Previous Exam',
        data: uniqueSubjects.length > 0 
          ? uniqueSubjects.map((sub) => {
              const r = marks.find((m) => m.subject === sub && m.term === previousTerm);
              return r ? r.obtainedMarks : 0;
            })
          : [0],
        backgroundColor: 'rgba(148, 163, 184, 0.65)',
        borderRadius: 6
      },
      {
        label: currentTerm ? `Current (${currentTerm})` : 'Current Exam',
        data: uniqueSubjects.length > 0
          ? uniqueSubjects.map((sub) => {
              const r = marks.find((m) => m.subject === sub && m.term === currentTerm);
              return r ? r.obtainedMarks : 0;
            })
          : [0],
        backgroundColor: '#4f46e5',
        borderRadius: 6
      }
    ]
  };

  // Chart 3: Radar Chart
  const radarChartData = {
    labels: uniqueSubjects.length > 0 ? uniqueSubjects : ['General'],
    datasets: [{
      label: 'Subject Proficiency (%)',
      data: uniqueSubjects.length > 0
        ? uniqueSubjects.map((sub) => {
            const subMarks = marks.filter((m) => m.subject === sub);
            if (subMarks.length === 0) return 0;
            return (subMarks.reduce((acc, curr) => acc + (curr.obtainedMarks / curr.maxMarks) * 100, 0) / subMarks.length).toFixed(1);
          })
        : [0],
      backgroundColor: 'rgba(79, 70, 229, 0.2)',
      borderColor: '#4f46e5'
    }]
  };

  // Chart 4: Doughnut Chart
  const attendanceDonutData = {
    labels: ['Present', 'Absent', 'Late'],
    datasets: [{
      data: [
        academicSummary.presentDays || 0, 
        academicSummary.absentDays || 0, 
        academicSummary.lateDays || 0
      ],
      backgroundColor: ['#10b981', '#ef4444', '#f59e0b']
    }]
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <Navbar />

      {/* Sibling Switcher Header */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-6 py-3 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold text-base shadow-sm">
              {currentStudent?.firstName ? currentStudent.firstName[0] : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900 leading-none">
                  {currentStudent ? `${currentStudent.firstName} ${currentStudent.lastName}` : 'Enrolled Student'}
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Class {currentStudent?.className || 'N/A'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Roll Number: {currentStudent?.rollNumber || 'N/A'}</p>
            </div>
          </div>

          {allChildren.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Switch Sibling:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold bg-white text-slate-800"
              >
                {allChildren.map((c) => (
                  <option key={c._id} value={c._id}>{c.firstName} {c.lastName} (Class {c.className})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto p-6 space-y-6">
        {liveAlerts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900 text-xs">
            <Bell className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-[11px] uppercase tracking-wider text-amber-700">Live Notifications</p>
              {liveAlerts.slice(0, 3).map((alert, idx) => (
                <p key={idx} className="text-slate-700 font-medium">{alert}</p>
              ))}
            </div>
          </div>
        )}

        {statusMsg.text && (
          <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold ${
            statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          {[
            { id: 'home', label: 'Summary', icon: Sparkles },
            { id: 'exams', label: 'Exam Timetable', icon: Calendar },
            { id: 'marks', label: 'Academic Grades', icon: Award },
            { id: 'analytics', label: 'Performance Analytics', icon: TrendingUp },
            { id: 'attendance', label: 'Attendance & Leave', icon: Calendar },
            { id: 'concerns', label: 'Teacher Inquiries', icon: MessageSquare },
            { id: 'notices', label: 'Announcements Feed', icon: Bell }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === id ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: SUMMARY */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance Status</span>
                <p className="text-3xl font-black text-emerald-600 mt-1">{academicSummary.attendancePercentage}%</p>
                <p className="text-xs text-slate-500 mt-1">{academicSummary.presentDays} Present / {academicSummary.totalClassesLogged} Recorded School Days</p>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic Score Average</span>
                <p className="text-3xl font-black text-indigo-600 mt-1">{averageScore}{averageScore !== 'N/A' ? '%' : ''}</p>
                <p className="text-xs text-slate-500 mt-1">Across all examination terms</p>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Faculty</span>
                <p className="text-sm font-bold text-slate-900 mt-1">Class {currentStudent?.className || 'N/A'} Mentor</p>
                <p className="text-xs text-slate-500 mt-0.5">Check Teacher Inquiries tab to message teachers</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OPTION C - EXAM TIMETABLE FOR PARENTS */}
        {activeTab === 'exams' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Official Class Exam Timetable</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upcoming examination dates, subjects, and paper timings scheduled by faculty for Class {currentStudent?.className}.
              </p>
            </div>

            <div className="space-y-4">
              {exams.map((ex) => {
                // Filter papers matching active child's class
                const classPapers = (ex.subjectSchedules || []).filter(
                  s => s.className === currentStudent?.className
                );

                return (
                  <div key={ex._id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{ex.examName} ({ex.term})</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                            Academic Year: {ex.academicYear}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Term Window: {new Date(ex.startDate).toLocaleDateString()} — {new Date(ex.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Subject</th>
                            <th className="p-3">Exam Date</th>
                            <th className="p-3">Paper Timing</th>
                            <th className="p-3">Maximum Marks</th>
                            <th className="p-3">Invigilator / Faculty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {classPapers.map((paper) => (
                            <tr key={paper._id} className="hover:bg-slate-50/60">
                              <td className="p-3 font-bold text-indigo-900 flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                                {paper.subject}
                              </td>
                              <td className="p-3 font-semibold text-slate-800">
                                {new Date(paper.examDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="p-3 text-slate-600 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {paper.startTime} – {paper.endTime}
                              </td>
                              <td className="p-3 font-bold text-slate-700">{paper.maxMarks} Marks</td>
                              <td className="p-3 text-slate-500 italic">{paper.teacherName || 'Faculty'}</td>
                            </tr>
                          ))}
                          {classPapers.length === 0 && (
                            <tr>
                              <td colSpan="5" className="p-4 text-center text-slate-400 italic">
                                Subject teachers have not yet assigned specific paper dates for this exam cycle. Check back soon.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              {exams.length === 0 && (
                <p className="text-center text-slate-400 text-xs py-8 border border-dashed rounded-xl">
                  No examination cycles scheduled for Class {currentStudent?.className}.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MARKS */}
        {activeTab === 'marks' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Official Report Card</h3>
                <p className="text-xs text-slate-500 mt-0.5">Filter grades by academic exam term.</p>
              </div>
              <select
                value={selectedTermFilter}
                onChange={(e) => setSelectedTermFilter(e.target.value)}
                className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold bg-white"
              >
                <option value="All">All Exam Terms</option>
                {termsList.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b">
                  <tr>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Term</th>
                    <th className="p-3">Obtained / Max</th>
                    <th className="p-3">Percentage</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMarks.map((m) => {
                    const pct = ((m.obtainedMarks / m.maxMarks) * 100).toFixed(1);
                    return (
                      <tr key={m._id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-bold text-slate-800">{m.subject}</td>
                        <td className="p-3 text-slate-600">{m.term}</td>
                        <td className="p-3 font-bold text-indigo-600">{m.obtainedMarks} / {m.maxMarks}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            Number(pct) >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {pct}%
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 italic">{m.remarks || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PERFORMANCE ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">1. Term-over-Term Growth</h4>
              <div className="h-64"><Line data={termGrowthChartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">2. Previous vs Current Exam</h4>
              <div className="h-64"><Bar data={comparativeBarChartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">3. Subject Proficiency</h4>
              <div className="h-64 flex items-center justify-center"><Radar data={radarChartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">4. Attendance Distribution</h4>
              <div className="h-64 flex items-center justify-center"><Doughnut data={attendanceDonutData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
            </div>
          </div>
        )}

        {/* TAB 5: ATTENDANCE & LEAVE */}
        {activeTab === 'attendance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Attendance Log</h3>
              <div className="max-h-80 overflow-y-auto border rounded-xl divide-y">
                {attendanceHistory.map((att) => (
                  <div key={att._id} className="p-3 text-xs flex justify-between items-center hover:bg-slate-50">
                    <span className="font-semibold text-slate-700">{new Date(att.date).toLocaleDateString()}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      att.status === 'Present' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>{att.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Apply for Student Leave</h3>
              <form onSubmit={handleLeaveSubmit} className="space-y-3 text-xs">
                <input required type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} className="w-full border p-2 rounded-xl" />
                <input required type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} className="w-full border p-2 rounded-xl" />
                <textarea required rows="3" placeholder="Reason..." value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} className="w-full border p-2 rounded-xl" />
                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5"><Send className="w-3.5 h-3.5" /> Submit Application</button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 6: TEACHER INQUIRIES */}
        {activeTab === 'concerns' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Contact Subject Teacher</h3>
                <p className="text-xs text-slate-500 mt-0.5">Send a private inquiry regarding your child's academic progress.</p>
              </div>

              <form onSubmit={handleConcernSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Target Teacher</label>
                  <select
                    required
                    value={concernForm.targetTeacherId}
                    onChange={(e) => setConcernForm({ ...concernForm, targetTeacherId: e.target.value })}
                    className="w-full border p-2.5 rounded-xl bg-white font-medium"
                  >
                    <option value="">Select Faculty</option>
                    {classTeachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.classesHandled?.find((ch) => ch.className === currentStudent?.className)?.subjects?.join(', ') || t.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Topic / Subject</label>
                  <input
                    required
                    placeholder="e.g. Mathematics Chapter 4 Clarification"
                    value={concernForm.subject}
                    onChange={(e) => setConcernForm({ ...concernForm, subject: e.target.value })}
                    className="w-full border p-2.5 rounded-xl bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Your Message / Query</label>
                  <textarea
                    required
                    rows="4"
                    placeholder="Please explain your question or observation..."
                    value={concernForm.message}
                    onChange={(e) => setConcernForm({ ...concernForm, message: e.target.value })}
                    className="w-full border p-2.5 rounded-xl bg-white font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Send Direct Inquiry
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Communication History</h3>
                <p className="text-xs text-slate-500 mt-0.5">Threaded updates and replies from subject faculty.</p>
              </div>

              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {concerns.map((con) => (
                  <div key={con._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                          Teacher: {con.targetTeacher?.name || 'Faculty Member'}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">{con.subject}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        con.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {con.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200/80 leading-relaxed">
                      "{con.message}"
                    </p>

                    {con.response ? (
                      <div className="pl-4 border-l-2 border-emerald-500 bg-emerald-50/50 p-3 rounded-r-lg space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900">
                          <CornerDownRight className="w-3.5 h-3.5 text-emerald-600" /> Faculty Response:
                        </div>
                        <p className="text-xs text-slate-700">{con.response}</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-600 italic flex items-center gap-1">
                        Awaiting response from teacher...
                      </p>
                    )}
                  </div>
                ))}

                {concerns.length === 0 && (
                  <p className="text-center text-slate-400 text-xs py-8 border border-dashed rounded-xl">
                    No inquiries sent yet. Use the form on the left to contact your child's teachers.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: NOTICES */}
        {activeTab === 'notices' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">School Bulletins & Class Notices</h3>
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-900">{a.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{a.description}</p>
                  <div className="flex justify-between items-center border-t pt-2 mt-3 text-[11px] text-slate-400">
                    <span>Valid: {new Date(a.startDate).toLocaleDateString()} - {new Date(a.endDate).toLocaleDateString()}</span>
                    <button
                      type="button"
                      onClick={() => handleAcknowledgeNotice(a._id)}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Acknowledge Notice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;