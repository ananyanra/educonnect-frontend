import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Navbar from '../../components/Navbar';
import { 
  BookOpen, Award, CheckSquare, Plus, CheckCircle2, 
  AlertCircle, Save, Calendar, UserCheck, Check, X,
  Sparkles, MessageSquare, Send, CornerDownRight, Bell, Clock, Trash2
} from 'lucide-react';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('classes');
  const [teacherData, setTeacherData] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [classStudents, setClassStudents] = useState([]);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Attendance Marking State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);

  // Digital Leave Requests State
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveFilter, setLeaveFilter] = useState('Pending');

  // Parent Concerns State
  const [concerns, setConcerns] = useState([]);
  const [replyTextMap, setReplyTextMap] = useState({});

  // Teacher Announcement State
  const [teacherAnnouncements, setTeacherAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    description: '',
    targetClass: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });
  const [isPostingNotice, setIsPostingNotice] = useState(false);

  // Streamlined Gradebook State
  const [gradeClass, setGradeClass] = useState('');
  const [gradeSubject, setGradeSubject] = useState('');
  const [gradeTerm, setGradeTerm] = useState('Term 1');
  const [gradeMaxMarks, setGradeMaxMarks] = useState(100);
  const [gradeStudentsList, setGradeStudentsList] = useState([]);
  const [studentMarksMap, setStudentMarksMap] = useState({});
  const [isSubmittingGrades, setIsSubmittingGrades] = useState(false);

  // Syllabus Tracker Form State
  const [progressForm, setProgressForm] = useState({
    className: '',
    subject: '',
    currentChapter: '',
    notes: ''
  });

  // Reminders State
  const [reminderNote, setReminderNote] = useState('');
  const [reminderDate, setReminderDate] = useState('');

  // Option C: Exam Schedule State
  const [availableExams, setAvailableExams] = useState([]);
  const [paperScheduleForm, setPaperScheduleForm] = useState({
    examId: '',
    className: '',
    subject: '',
    examDate: '',
    startTime: '09:30 AM',
    endTime: '12:30 PM',
    maxMarks: 100
  });

  useEffect(() => {
    fetchTeacherHome();
  }, []);

  useEffect(() => {
    if (activeTab === 'leave') {
      fetchLeaveRequests();
    } else if (activeTab === 'concerns') {
      fetchConcerns();
    } else if (activeTab === 'notices') {
      fetchTeacherAnnouncementsList();
    } else if (activeTab === 'exams') {
      fetchExams();
    }
  }, [activeTab, leaveFilter]);

  const fetchTeacherHome = async () => {
    try {
      const res = await axiosClient.get('/teacher/home');
      const profile = res.data?.teacherProfile || null;
      setTeacherData({
        profile,
        progress: res.data?.progress || [],
        reminders: res.data?.reminders || [],
        notifications: res.data?.notifications || [],
        stats: res.data?.stats || { totalClassesHandled: 0, pendingLeavesCount: 0, openConcernsCount: 0 }
      });
      setAvailableExams(res.data?.exams || []);

      if (profile?.classesHandled?.length > 0) {
        const firstClass = profile.classesHandled[0].className;
        setSelectedClass(firstClass);
        fetchClassDetails(firstClass);

        // Initialize gradebook defaults
        setGradeClass(firstClass);
        const firstSubject = profile.classesHandled[0].subjects?.[0] || '';
        setGradeSubject(firstSubject);
        fetchGradebookStudents(firstClass);

        setPaperScheduleForm((prev) => ({
          ...prev,
          className: firstClass,
          subject: firstSubject
        }));
      }
    } catch (err) {
      console.error('Failed to load teacher home:', err);
    }
  };

  const fetchExams = async () => {
    try {
      const res = await axiosClient.get('/teacher/exams');
      setAvailableExams(res.data?.exams || []);
    } catch (err) {
      console.error('Failed to load exams:', err);
    }
  };

  const fetchClassDetails = async (className) => {
    try {
      const res = await axiosClient.get(`/teacher/class/${className}`);
      const students = res.data?.students || [];
      setClassStudents(students);

      const initialMap = {};
      students.forEach((s) => {
        initialMap[s._id] = 'Present';
      });
      setAttendanceRecords(initialMap);

      setProgressForm((prev) => ({ ...prev, className }));
      setAnnouncementForm((prev) => ({ ...prev, targetClass: className }));
    } catch (err) {
      console.error('Failed to load class details:', err);
    }
  };

  const fetchGradebookStudents = async (className) => {
    try {
      const res = await axiosClient.get(`/teacher/class/${className}`);
      const students = res.data?.students || [];
      setGradeStudentsList(students);

      // Populate existing marks if any
      const marksMap = {};
      students.forEach((s) => {
        marksMap[s._id] = { obtainedMarks: '', remarks: '' };
      });
      // Map existing student marks from response if returned
      const existingMarks = res.data?.marks || [];
      existingMarks.forEach((m) => {
        if (marksMap[m.studentId]) {
          marksMap[m.studentId] = {
            obtainedMarks: m.obtainedMarks,
            remarks: m.remarks || ''
          };
        }
      });
      setStudentMarksMap(marksMap);
    } catch (err) {
      console.error('Failed to load gradebook roster:', err);
    }
  };

  const handleGradeClassChange = (cls) => {
    setGradeClass(cls);
    // Automatically select the first available subject for this class from teacher's profile
    const targetHandling = classesHandled.find(c => c.className === cls);
    if (targetHandling && targetHandling.subjects?.length > 0) {
      setGradeSubject(targetHandling.subjects[0]);
    }
    fetchGradebookStudents(cls);
  };

  const handleStudentMarkInput = (studentId, field, value) => {
    setStudentMarksMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleBulkSubmitMarks = async (e) => {
    e.preventDefault();
    if (!gradeClass || !gradeSubject || !gradeTerm) {
      return showNotification('error', 'Please select class, subject, and term.');
    }

    setIsSubmittingGrades(true);
    const recordsPayload = Object.keys(studentMarksMap).map((studentId) => ({
      studentId,
      obtainedMarks: studentMarksMap[studentId].obtainedMarks,
      remarks: studentMarksMap[studentId].remarks
    })).filter(r => r.obtainedMarks !== '' && r.obtainedMarks !== null);

    if (recordsPayload.length === 0) {
      return showNotification('error', 'Please enter marks for at least one student before submitting.');
    }

    try {
      await axiosClient.post('/teacher/marks/bulk-upload', {
        className: gradeClass,
        subject: gradeSubject,
        term: gradeTerm,
        maxMarks: Number(gradeMaxMarks) || 100,
        records: recordsPayload
      });
      showNotification('success', `Grades successfully published for Class ${gradeClass} (${gradeSubject})!`);
      fetchGradebookStudents(gradeClass);
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to submit class grades.');
    } finally {
      setIsSubmittingGrades(false);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const res = await axiosClient.get(`/teacher/leave-requests${leaveFilter ? `?status=${leaveFilter}` : ''}`);
      setLeaveRequests(res.data?.leaveRequests || []);
    } catch (err) {
      console.error('Failed to load leave requests:', err);
    }
  };

  const fetchConcerns = async () => {
    try {
      const res = await axiosClient.get('/teacher/concerns');
      const data = res.data?.concerns || res.data || [];
      setConcerns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load concerns:', err);
    }
  };

  const showNotification = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 5000);
  };

  const handleClassChange = (cls) => {
    setSelectedClass(cls);
    fetchClassDetails(cls);
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    classStudents.forEach((s) => {
      updated[s._id] = status;
    });
    setAttendanceRecords(updated);
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (!selectedClass || classStudents.length === 0) return;

    setIsSubmittingAttendance(true);
    const recordsPayload = classStudents.map((s) => ({
      studentId: s._id,
      status: attendanceRecords[s._id] || 'Present'
    }));

    try {
      await axiosClient.post('/teacher/attendance', {
        className: selectedClass,
        date: attendanceDate,
        records: recordsPayload
      });
      showNotification('success', `Attendance logged for Class ${selectedClass}!`);
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to submit attendance.');
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  const handleUpdateLeaveStatus = async (leaveId, status) => {
    try {
      await axiosClient.put(`/teacher/leave-request/${leaveId}/status`, { status });
      showNotification('success', `Leave application marked as ${status}!`);
      setLeaveRequests((prev) => prev.filter((item) => item._id !== leaveId));
      fetchTeacherHome();
    } catch (err) {
      showNotification('error', 'Failed to update leave status.');
    }
  };

  const handleReplyConcern = async (concernId) => {
    const replyText = replyTextMap[concernId];
    if (!replyText || !replyText.trim()) {
      return showNotification('error', 'Please write a reply before submitting.');
    }

    try {
      await axiosClient.put(`/teacher/concern/${concernId}/reply`, { response: replyText });
      showNotification('success', 'Response sent to parent!');
      setReplyTextMap((prev) => ({ ...prev, [concernId]: '' }));
      fetchConcerns();
      fetchTeacherHome();
    } catch (err) {
      showNotification('error', 'Failed to submit reply.');
    }
  };

  const fetchTeacherAnnouncementsList = async () => {
    try {
      const res = await axiosClient.get('/teacher/announcements');
      setTeacherAnnouncements(Array.isArray(res.data) ? res.data : res.data?.announcements || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setIsPostingNotice(true);
    try {
      await axiosClient.post('/teacher/announcements', announcementForm);
      showNotification('success', `Notice published to Class ${announcementForm.targetClass}!`);
      setAnnouncementForm({
        title: '',
        description: '',
        targetClass: classesHandled[0]?.className || '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
      });
      fetchTeacherAnnouncementsList();
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to publish announcement.');
    } finally {
      setIsPostingNotice(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await axiosClient.delete(`/teacher/announcements/${id}`);
      showNotification('success', 'Announcement removed.');
      setTeacherAnnouncements((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      showNotification('error', 'Failed to remove announcement.');
    }
  };

  const handleSaveProgress = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/teacher/progress', progressForm);
      showNotification('success', 'Syllabus progress updated!');
      fetchTeacherHome();
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to update progress.');
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/teacher/reminder', {
        note: reminderNote,
        reminderDate: new Date(reminderDate).toISOString()
      });
      showNotification('success', 'Reminder saved! It will remain active for 7 days.');
      setReminderNote('');
      setReminderDate('');
      fetchTeacherHome();
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to add reminder.');
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    try {
      await axiosClient.delete(`/teacher/reminder/${reminderId}`);
      showNotification('success', 'Note removed.');
      fetchTeacherHome();
    } catch (err) {
      showNotification('error', 'Failed to delete note.');
    }
  };

  const handleSchedulePaperSubmit = async (e) => {
    e.preventDefault();
    if (!paperScheduleForm.examId) {
      return showNotification('error', 'Please select an institutional exam cycle.');
    }

    try {
      await axiosClient.post('/teacher/exam/schedule-paper', paperScheduleForm);
      showNotification('success', `Paper scheduled for ${paperScheduleForm.subject} (Class ${paperScheduleForm.className})!`);
      fetchExams();
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to schedule exam paper.');
    }
  };

  const handleDeletePaperSlot = async (examId, slotId) => {
    if (!window.confirm('Are you sure you want to remove this scheduled paper?')) return;
    try {
      await axiosClient.delete(`/teacher/exam/${examId}/slot/${slotId}`);
      showNotification('success', 'Scheduled paper removed.');
      fetchExams();
    } catch (err) {
      showNotification('error', 'Failed to delete slot.');
    }
  };

  const classesHandled = teacherData?.profile?.classesHandled || [];
  const currentGradeClassHandling = classesHandled.find(c => c.className === gradeClass);
  const availableSubjectsForClass = currentGradeClassHandling?.subjects || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <Navbar />

      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-6 py-3.5 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold text-base shadow-sm">
              {teacherData?.profile?.name ? teacherData.profile.name[0] : 'T'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900 leading-none">
                  {teacherData?.profile?.name || 'Faculty Portal'}
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Faculty
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">{teacherData?.profile?.email || ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Class In-Charge</p>
              <p className="text-xs font-bold text-slate-800">
                {classesHandled.map((c) => c.className).join(', ') || 'No Classes Assigned'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 max-w-7xl w-full mx-auto p-6 gap-6">
        {/* Navigation Sidebar */}
        <div className="w-64 bg-white rounded-2xl border border-slate-200/80 p-3 h-fit space-y-1.5 shrink-0 shadow-xs">
          {[
            { id: 'classes', label: 'My Classes & Roster', icon: BookOpen },
            { id: 'attendance', label: 'Mark Attendance', icon: UserCheck },
            { id: 'exams', label: 'Exam Timetable', icon: Calendar },
            { id: 'leave', label: 'Leave Requests', icon: Calendar, badge: teacherData?.stats?.pendingLeavesCount },
            { id: 'concerns', label: 'Parent Inquiries', icon: MessageSquare, badge: teacherData?.stats?.openConcernsCount },
            { id: 'marks', label: 'Gradebook & Marks', icon: Award },
            { id: 'syllabus', label: 'Syllabus Tracker', icon: CheckSquare },
            { id: 'notices', label: 'Class Announcements', icon: Bell }
          ].map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </div>
              {badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === id ? 'bg-white text-indigo-700' : 'bg-rose-500 text-white'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          ))}

          <hr className="my-3 border-slate-100" />

          {/* Sticky Notes & Quick Reminders */}
          <div className="p-3 bg-gradient-to-br from-indigo-50/50 to-slate-50 rounded-xl border border-indigo-100/60">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Personal Notes
              </h4>
              <span className="text-[9px] font-semibold text-slate-400">7-day life</span>
            </div>
            <ul className="space-y-1.5 text-xs">
              {teacherData?.reminders?.slice(0, 4).map((r) => (
                <li key={r._id} className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs relative group">
                  <div className="flex justify-between items-start gap-1">
                    <p className="text-[11px] font-medium text-slate-700 line-clamp-2">{r.note}</p>
                    <button
                      type="button"
                      onClick={() => handleDeleteReminder(r._id)}
                      className="text-slate-300 hover:text-rose-600 p-0.5 transition shrink-0"
                      title="Delete Note"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[9px] font-semibold text-indigo-600 mt-1 block">
                    Due: {new Date(r.reminderDate).toLocaleDateString()}
                  </span>
                </li>
              ))}
              {(!teacherData?.reminders || teacherData.reminders.length === 0) && (
                <li className="text-slate-400 italic text-[11px] py-1 text-center">No notes in the past 7 days</li>
              )}
            </ul>
          </div>
        </div>

        {/* Right Main Panel */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs min-w-0">
          {statusMsg.text && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* TAB 1: CLASSES */}
          {activeTab === 'classes' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Enrolled Student Roster</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Browse students for your assigned sections.</p>
                </div>
                <select
                  value={selectedClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold bg-white text-slate-800"
                >
                  {classesHandled.map((c) => (
                    <option key={c.className} value={c.className}>Class {c.className}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-hidden border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Roll No</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Parent Name</th>
                      <th className="p-3">Parent Email</th>
                      <th className="p-3">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3 font-bold text-indigo-900">{s.rollNumber}</td>
                        <td className="p-3 font-semibold text-slate-800">{s.firstName} {s.lastName}</td>
                        <td className="p-3 text-slate-600">{s.parentName}</td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">{s.parentEmail}</td>
                        <td className="p-3 text-slate-600 font-medium">{s.parentPhone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Daily Class Attendance</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Mark attendance and trigger live parent updates.</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedClass}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold bg-white"
                  >
                    {classesHandled.map((c) => (
                      <option key={c.className} value={c.className}>Class {c.className}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Quick Batch Presets:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarkAll('Present')}
                    className="px-2.5 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg text-xs font-semibold"
                  >
                    All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('Absent')}
                    className="px-2.5 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded-lg text-xs font-semibold"
                  >
                    All Absent
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Roll No</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3 text-center">Status Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents.map((s) => {
                      const currentStatus = attendanceRecords[s._id] || 'Present';
                      return (
                        <tr key={s._id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-indigo-900">{s.rollNumber}</td>
                          <td className="p-3 font-semibold text-slate-800">{s.firstName} {s.lastName}</td>
                          <td className="p-3 text-center">
                            <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 gap-1">
                              {['Present', 'Absent', 'Late'].map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleStatusChange(s._id, st)}
                                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                    currentStatus === st
                                      ? st === 'Present'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : st === 'Absent'
                                        ? 'bg-red-600 text-white shadow-xs'
                                        : 'bg-amber-500 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={isSubmittingAttendance || classStudents.length === 0}
                  onClick={handleSubmitAttendance}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {isSubmittingAttendance ? 'Saving...' : 'Submit Attendance for Class'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: EXAM TIMETABLE */}
          {activeTab === 'exams' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">Exam Timetable & Paper Scheduler</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Schedule specific subject exam dates for your assigned classes within institutional exam cycle windows set by Admin.
                </p>
              </div>

              <form onSubmit={handleSchedulePaperSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Add Subject Paper to Timetable</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Select Exam Term</label>
                    <select
                      required
                      value={paperScheduleForm.examId}
                      onChange={(e) => setPaperScheduleForm({ ...paperScheduleForm, examId: e.target.value })}
                      className="w-full border border-slate-300 p-2 rounded-xl text-xs bg-white font-medium"
                    >
                      <option value="">Select Active Term</option>
                      {availableExams.map((ex) => (
                        <option key={ex._id} value={ex._id}>
                          {ex.examName} ({ex.term}) — {new Date(ex.startDate).toLocaleDateString()} to {new Date(ex.endDate).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
                    <select
                      required
                      value={paperScheduleForm.className}
                      onChange={(e) => setPaperScheduleForm({ ...paperScheduleForm, className: e.target.value })}
                      className="w-full border border-slate-300 p-2 rounded-xl text-xs bg-white font-medium"
                    >
                      {classesHandled.map((c) => (
                        <option key={c.className} value={c.className}>Class {c.className}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                    <input
                      required
                      placeholder="e.g. Mathematics, Science"
                      value={paperScheduleForm.subject}
                      onChange={(e) => setPaperScheduleForm({ ...paperScheduleForm, subject: e.target.value })}
                      className="w-full border border-slate-300 p-2 rounded-xl text-xs bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Paper Date</label>
                    <input
                      required
                      type="date"
                      value={paperScheduleForm.examDate}
                      onChange={(e) => setPaperScheduleForm({ ...paperScheduleForm, examDate: e.target.value })}
                      className="w-full border border-slate-300 p-2 rounded-xl text-xs bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Start Time</label>
                    <input
                      required
                      placeholder="e.g. 09:30 AM"
                      value={paperScheduleForm.startTime}
                      onChange={(e) => setPaperScheduleForm({ ...paperScheduleForm, startTime: e.target.value })}
                      className="w-full border border-slate-300 p-2 rounded-xl text-xs bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">End Time</label>
                    <input
                      required
                      placeholder="e.g. 12:30 PM"
                      value={paperScheduleForm.endTime}
                      onChange={(e) => setPaperScheduleForm({ ...paperScheduleForm, endTime: e.target.value })}
                      className="w-full border border-slate-300 p-2 rounded-xl text-xs bg-white font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add to Timetable
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Official Exam Cycles & Paper Schedules</h3>
                {availableExams.map((ex) => (
                  <div key={ex._id} className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
                    <div className="flex justify-between items-start border-b pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{ex.examName} ({ex.term})</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                            Academic Year: {ex.academicYear}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Window: <strong className="text-slate-700">{new Date(ex.startDate).toLocaleDateString()}</strong> to <strong className="text-slate-700">{new Date(ex.endDate).toLocaleDateString()}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                          <tr>
                            <th className="p-2.5">Class</th>
                            <th className="p-2.5">Subject</th>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Time</th>
                            <th className="p-2.5">Max Marks</th>
                            <th className="p-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(ex.subjectSchedules || []).map((slot) => (
                            <tr key={slot._id} className="hover:bg-slate-50/60">
                              <td className="p-2.5 font-bold text-indigo-900">Class {slot.className}</td>
                              <td className="p-2.5 font-semibold text-slate-800">{slot.subject}</td>
                              <td className="p-2.5 text-slate-600">{new Date(slot.examDate).toLocaleDateString()}</td>
                              <td className="p-2.5 text-slate-600">{slot.startTime} – {slot.endTime}</td>
                              <td className="p-2.5 text-slate-600">{slot.maxMarks}</td>
                              <td className="p-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeletePaperSlot(ex._id, slot._id)}
                                  className="text-slate-400 hover:text-red-600 p-1 rounded"
                                  title="Remove Paper Slot"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LEAVE REQUESTS */}
          {activeTab === 'leave' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Student Leave Applications</h2>
                  <p className="text-xs text-slate-500">Review digital absence notes from parents.</p>
                </div>

                <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs">
                  {['Pending', 'Approved', 'Rejected'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setLeaveFilter(status)}
                      className={`px-3 py-1 rounded-lg font-bold ${leaveFilter === status ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {leaveRequests.map((leave) => (
                  <div key={leave._id} className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            {leave.studentId?.firstName} {leave.studentId?.lastName}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            Class {leave.className}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1"><span className="font-bold">Reason:</span> {leave.reason}</p>
                      </div>

                      {leave.status === 'Pending' ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateLeaveStatus(leave._id, 'Approved')}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateLeaveStatus(leave._id, 'Rejected')}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                          {leave.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PARENT INQUIRIES */}
          {activeTab === 'concerns' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">Parent-Teacher Inquiry Channel</h2>
              </div>

              <div className="space-y-4">
                {concerns.map((con) => (
                  <div key={con._id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{con.studentId?.firstName} {con.studentId?.lastName} (Class {con.studentId?.className})</h4>
                        <p className="text-xs font-bold text-slate-700 mt-1">Topic: {con.subject}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${con.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {con.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">"{con.message}"</p>

                    {con.response ? (
                      <div className="pl-4 border-l-2 border-indigo-500 bg-indigo-50/40 p-2.5 rounded-r-lg">
                        <p className="text-xs text-slate-700">{con.response}</p>
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Type an official response..."
                          value={replyTextMap[con._id] || ''}
                          onChange={(e) => setReplyTextMap({ ...replyTextMap, [con._id]: e.target.value })}
                          className="flex-1 border border-slate-300 rounded-xl px-3 py-1.5 text-xs bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleReplyConcern(con._id)}
                          className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> Reply
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: STREAMLINED GRADEBOOK & MARKS (CLASS-WIDE BATCH UPLOAD) */}
          {activeTab === 'marks' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">Class-Wide Gradebook & Marks Entry</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select class and subject to grade all enrolled students in a single batch.</p>
              </div>

              {/* Step Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">1. Select Class</label>
                  <select
                    value={gradeClass}
                    onChange={(e) => handleGradeClassChange(e.target.value)}
                    className="w-full border border-slate-300 p-2 rounded-xl text-xs bg-white font-bold text-indigo-900"
                  >
                    {classesHandled.map((c) => (
                      <option key={c.className} value={c.className}>Class {c.className}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">2. Select Subject</label>
                  <select
                    value={gradeSubject}
                    onChange={(e) => setGradeSubject(e.target.value)}
                    className="w-full border border-slate-300 p-2 rounded-xl text-xs bg-white font-bold text-indigo-900"
                  >
                    {availableSubjectsForClass.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">3. Exam Term</label>
                  <input
                    placeholder="e.g. Term 1, Mid-Term"
                    value={gradeTerm}
                    onChange={(e) => setGradeTerm(e.target.value)}
                    className="w-full border border-slate-300 p-2 rounded-xl text-xs bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">4. Maximum Marks</label>
                  <input
                    type="number"
                    value={gradeMaxMarks}
                    onChange={(e) => setGradeMaxMarks(e.target.value)}
                    className="w-full border border-slate-300 p-2 rounded-xl text-xs bg-white font-bold"
                  />
                </div>
              </div>

              {/* Class Student Roster for Grading */}
              <form onSubmit={handleBulkSubmitMarks} className="space-y-4">
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b">
                      <tr>
                        <th className="p-3">Roll No</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Obtained Marks ({gradeMaxMarks})</th>
                        <th className="p-3">Faculty Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {gradeStudentsList.map((s) => {
                        const studentData = studentMarksMap[s._id] || { obtainedMarks: '', remarks: '' };
                        return (
                          <tr key={s._id} className="hover:bg-slate-50/60">
                            <td className="p-3 font-bold text-indigo-900">{s.rollNumber}</td>
                            <td className="p-3 font-semibold text-slate-800">{s.firstName} {s.lastName}</td>
                            <td className="p-3">
                              <input
                                type="number"
                                placeholder="Marks"
                                value={studentData.obtainedMarks}
                                onChange={(e) => handleStudentMarkInput(s._id, 'obtainedMarks', e.target.value)}
                                className="w-28 border border-slate-300 p-1.5 rounded-lg text-xs bg-white font-bold text-indigo-600 focus:border-indigo-500"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                placeholder="Optional remarks..."
                                value={studentData.remarks}
                                onChange={(e) => handleStudentMarkInput(s._id, 'remarks', e.target.value)}
                                className="w-full border border-slate-300 p-1.5 rounded-lg text-xs bg-white"
                              />
                            </td>
                          </tr>
                        );
                      })}
                      {gradeStudentsList.length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-6 text-center text-slate-400 italic">
                            No students enrolled in Class {gradeClass}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingGrades || gradeStudentsList.length === 0}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSubmittingGrades ? 'Publishing Grades...' : `Save & Publish Grades for Class ${gradeClass}`}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 7: SYLLABUS */}
          {activeTab === 'syllabus' && (
            <div className="space-y-6">
              <div>
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h2 className="text-base font-bold text-slate-900">Syllabus Milestone Tracking</h2>
                </div>
                <form onSubmit={handleSaveProgress} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input required placeholder="Class (e.g. 10A)" value={progressForm.className} onChange={(e) => setProgressForm({ ...progressForm, className: e.target.value })} className="border border-slate-300 p-2.5 rounded-xl text-xs bg-white font-medium" />
                  <input required placeholder="Subject (e.g. Science)" value={progressForm.subject} onChange={(e) => setProgressForm({ ...progressForm, subject: e.target.value })} className="border border-slate-300 p-2.5 rounded-xl text-xs bg-white font-medium" />
                  <input required placeholder="Current Chapter" value={progressForm.currentChapter} onChange={(e) => setProgressForm({ ...progressForm, currentChapter: e.target.value })} className="sm:col-span-2 border border-slate-300 p-2.5 rounded-xl text-xs bg-white font-medium" />
                  <button type="submit" className="sm:col-span-2 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"><Save className="w-4 h-4" /> Save Milestone</button>
                </form>
              </div>

              <hr className="border-slate-100" />

              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">Add Faculty Reminder (7-Day Duration)</h3>
                <form onSubmit={handleAddReminder} className="flex flex-col sm:flex-row gap-2.5">
                  <input required placeholder="Reminder note..." value={reminderNote} onChange={(e) => setReminderNote(e.target.value)} className="flex-1 border border-slate-300 p-2 rounded-xl text-xs bg-white font-medium" />
                  <input required type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} className="border border-slate-300 p-2 rounded-xl text-xs bg-white font-medium" />
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1 shrink-0"><Plus className="w-3.5 h-3.5" /> Add Note</button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 8: NOTICES */}
          {activeTab === 'notices' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">Broadcast Class Notice</h2>
              </div>
              <form onSubmit={handleCreateAnnouncement} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select required value={announcementForm.targetClass} onChange={(e) => setAnnouncementForm({ ...announcementForm, targetClass: e.target.value })} className="w-full border p-2.5 rounded-xl text-xs bg-white font-medium">
                    <option value="">Select Target Class</option>
                    {classesHandled.map((c) => <option key={c.className} value={c.className}>Class {c.className}</option>)}
                  </select>
                  <input required placeholder="Headline" value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} className="w-full border p-2.5 rounded-xl text-xs bg-white font-medium" />
                  <input required type="date" value={announcementForm.startDate} onChange={(e) => setAnnouncementForm({ ...announcementForm, startDate: e.target.value })} className="w-full border p-2.5 rounded-xl text-xs bg-white font-medium" />
                  <input required type="date" value={announcementForm.endDate} onChange={(e) => setAnnouncementForm({ ...announcementForm, endDate: e.target.value })} className="w-full border p-2.5 rounded-xl text-xs bg-white font-medium" />
                </div>
                <textarea required rows="3" placeholder="Message..." value={announcementForm.description} onChange={(e) => setAnnouncementForm({ ...announcementForm, description: e.target.value })} className="w-full border p-2.5 rounded-xl text-xs bg-white font-medium" />
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> Broadcast</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;  