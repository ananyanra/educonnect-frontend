import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Navbar from '../../components/Navbar';
import { 
  Users, UserCheck, BookOpen, Calendar, 
  ShieldAlert, Upload, CheckCircle2, AlertCircle, Layers, Plus, Trash2, 
  HeartHandshake, Search, Edit3, X, Eye, Bell
} from 'lucide-react';

// Searchable Dropdown Sub-Component
const SearchableSelect = ({ label, options, value, onChange, placeholder }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      {label && <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="border border-slate-300 rounded-lg p-2.5 text-sm bg-white cursor-pointer flex justify-between items-center hover:border-indigo-500"
      >
        <span className={value ? 'text-slate-800 font-medium' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <span className="text-xs text-slate-400">▼</span>
      </div>

      {isOpen && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-2">
          <input
            type="text"
            autoFocus
            placeholder={`Search ${label ? label.toLowerCase() : 'options'}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-md p-2 text-xs mb-2 outline-none focus:border-indigo-500"
          />
          <div className="max-h-40 overflow-y-auto space-y-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`p-2 text-xs rounded-md cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 ${
                    value === opt ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-700'
                  }`}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="p-2 text-xs text-slate-400 text-center">No matches found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ 
    studentCount: 0, 
    teacherCount: 0, 
    classCount: 0,
    todayAttendanceCount: 0 
  });
  const [announcements, setAnnouncements] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditKeyword, setAuditKeyword] = useState('');
  const [teachersList, setTeachersList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [classesOverview, setClassesOverview] = useState([]);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Standard drop-down values
  const standardClasses = ['1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '10B', '11A', '12A'];
  const standardSubjects = ['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English', 'Social Studies', 'Computer Science', 'Hindi'];

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Profile Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [adminProfile, setAdminProfile] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    profileImage: ''
  });

  // Selected Announcement Modal for Overview
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // Council Members State
  const [councilMembers, setCouncilMembers] = useState([]);
  const [councilForm, setCouncilForm] = useState({ id: '', name: '', position: '', photoUrl: '', contact: '' });
  const [isCouncilModalOpen, setIsCouncilModalOpen] = useState(false);

  // Student Section State
  const [selectedStudentClass, setSelectedStudentClass] = useState('10A');
  const [studentRoster, setStudentRoster] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({
    firstName: '', lastName: '', parentName: '', parentEmail: '',
    parentPhone: '', address: '', className: '10A', rollNumber: '', photoUrl: ''
  });

  // Teacher Section State
  const [leadership, setLeadership] = useState([]);
  const [selectedTeacherClass, setSelectedTeacherClass] = useState('10A');
  const [classTeachersList, setClassTeachersList] = useState([]);
  const [teacherForm, setTeacherForm] = useState({
    name: '', email: '', phone: '', password: ''
  });
  const [numClasses, setNumClasses] = useState(1);
  const [assignedRows, setAssignedRows] = useState([{ className: '', subject: '' }]);

  // Add Class Form State (Simplified: removed subject mapping fields)
  const [classForm, setClassForm] = useState({
    className: '',
    classTeacherId: ''
  });
  const [selectedClassDetail, setSelectedClassDetail] = useState(null);

  // Parent Form State
  const [parentForm, setParentForm] = useState({
    name: '', email: '', phone: '', password: '', selectedStudentIds: []
  });

  // Dynamic Exam form state
  const [examForm, setExamForm] = useState({
    examName: '',
    academicYear: '2025-2026',
    term: 'Term 1',
    classesApplicable: [],
    startDate: '',
    endDate: ''
  });

  // Announcement Form State
  const [announcementForm, setAnnouncementForm] = useState({
    title: '', description: '', targetClass: 'All', startDate: '', endDate: ''
  });

  // Bulk Upload states with Class Selection
  const [selectedTargetClass, setSelectedTargetClass] = useState('');
  const [csvFile, setCsvFile] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const res = await axiosClient.get('/admin/profile');
      if (res.data?.admin) {
        setAdminProfile(res.data.admin);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      if (activeTab === 'overview') {
        const res = await axiosClient.get('/admin/home');
        setStats({
          studentCount: res.data?.data?.stats?.totalStudents || 0,
          teacherCount: res.data?.data?.stats?.totalTeachers || 0,
          classCount: res.data?.data?.stats?.totalClasses || 0,
          todayAttendanceCount: res.data?.data?.stats?.todayAttendanceCount || 0,
        });
        setAnnouncements(res.data?.data?.announcements || []);
      } else if (activeTab === 'students') {
        const [councilRes, rosterRes] = await Promise.all([
          axiosClient.get('/admin/council'),
          axiosClient.get(`/admin/students?className=${selectedStudentClass}`)
        ]);
        setCouncilMembers(councilRes.data?.members || []);
        setStudentRoster(rosterRes.data?.students || []);
      } else if (activeTab === 'teachers') {
        const [overviewRes, byClassRes, allTeachersRes] = await Promise.all([
          axiosClient.get('/admin/teachers-overview'),
          axiosClient.get(`/admin/teachers-by-class/${selectedTeacherClass}`),
          axiosClient.get('/admin/teachers')
        ]);
        setLeadership(overviewRes.data?.leadership || []);
        setClassTeachersList(byClassRes.data?.teachers || []);
        setTeachersList(allTeachersRes.data?.teachers || []);
      } else if (activeTab === 'classes') {
        const [teachersRes, classesRes] = await Promise.all([
          axiosClient.get('/admin/teachers'),
          axiosClient.get('/admin/classes')
        ]);
        setTeachersList(teachersRes.data?.teachers || []);
        setClassesOverview(classesRes.data?.classes || []);
      } else if (activeTab === 'parents') {
        const res = await axiosClient.get('/admin/students');
        setStudentsList(res.data?.students || []);
      } else if (activeTab === 'audit') {
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async (keyword = '') => {
    try {
      const res = await axiosClient.get(`/admin/audit-logs${keyword ? `?keyword=${keyword}` : ''}`);
      setAuditLogs(res.data?.logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const showNotification = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 5000);
  };

  // Global Search Handler
  const handleGlobalSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const res = await axiosClient.get(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(res.data?.results || null);
    } catch (err) {
      showNotification('error', 'Search query failed.');
    } finally {
      setIsSearching(false);
    }
  };

  // Profile Update Handler
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.put('/admin/profile', adminProfile);
      showNotification('success', 'Profile updated successfully!');
      setAdminProfile(res.data.admin);
      setIsProfileOpen(false);
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to update profile.');
    }
  };

  // Council Handler
  const handleSaveCouncilMember = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/admin/council', councilForm);
      showNotification('success', 'Council member saved successfully!');
      setIsCouncilModalOpen(false);
      setCouncilForm({ id: '', name: '', position: '', photoUrl: '', contact: '' });
      const councilRes = await axiosClient.get('/admin/council');
      setCouncilMembers(councilRes.data?.members || []);
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to save council member.');
    }
  };

  const handleDeleteCouncilMember = async (id) => {
    if (!window.confirm('Are you sure you want to remove this council member?')) return;
    try {
      await axiosClient.delete(`/admin/council/${id}`);
      showNotification('success', 'Council member removed!');
      setCouncilMembers(councilMembers.filter(m => m._id !== id));
    } catch (err) {
      showNotification('error', 'Failed to remove member.');
    }
  };

  // Student Roster Change based on Dropdown
  const handleClassFilterChange = async (cls) => {
    setSelectedStudentClass(cls);
    try {
      const res = await axiosClient.get(`/admin/students?className=${cls}`);
      setStudentRoster(res.data?.students || []);
    } catch (err) {
      showNotification('error', 'Failed to load class roster.');
    }
  };

  // Student Delete & Edit Handlers
  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Delete this student permanently?')) return;
    try {
      await axiosClient.delete(`/admin/students/${id}`);
      showNotification('success', 'Student removed successfully.');
      setStudentRoster(studentRoster.filter(s => s._id !== id));
    } catch (err) {
      showNotification('error', 'Failed to delete student.');
    }
  };

  const handleUpdateStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.put(`/admin/students/${editingStudent._id}`, editingStudent);
      showNotification('success', 'Student details updated!');
      setStudentRoster(studentRoster.map(s => s._id === editingStudent._id ? res.data.student : s));
      setEditingStudent(null);
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to update student.');
    }
  };

  // Teachers by Class Filter
  const handleTeacherClassFilterChange = async (cls) => {
    setSelectedTeacherClass(cls);
    try {
      const res = await axiosClient.get(`/admin/teachers-by-class/${cls}`);
      setClassTeachersList(res.data?.teachers || []);
    } catch (err) {
      showNotification('error', 'Failed to load teachers for class.');
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    try {
      await axiosClient.delete(`/admin/teachers/${id}`);
      showNotification('success', 'Teacher removed successfully.');
      const res = await axiosClient.get('/admin/teachers');
      setTeachersList(res.data?.teachers || []);
      handleTeacherClassFilterChange(selectedTeacherClass);
    } catch (err) {
      showNotification('error', 'Failed to delete teacher.');
    }
  };

  // Dynamic Teacher Slot Handlers
  const handleNumClassesChange = (e) => {
    const count = Math.max(1, parseInt(e.target.value, 10) || 1);
    setNumClasses(count);
    setAssignedRows((prev) => {
      const nextRows = [...prev];
      if (count > nextRows.length) {
        while (nextRows.length < count) {
          nextRows.push({ className: '', subject: '' });
        }
      } else {
        nextRows.length = count;
      }
      return nextRows;
    });
  };

  const handleRowChange = (index, field, val) => {
    setAssignedRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Class Detailed View Loader
  const handleViewClassDetails = async (className) => {
    try {
      const res = await axiosClient.get(`/admin/class/${className}`);
      setSelectedClassDetail(res.data?.classData || null);
    } catch (err) {
      showNotification('error', 'Failed to load class details.');
    }
  };

  // Multi-Student toggle for Parent Linking
  const toggleStudentSelection = (studentId) => {
    setParentForm((prev) => {
      const current = prev.selectedStudentIds;
      const updated = current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId];
      return { ...prev, selectedStudentIds: updated };
    });
  };

  // Class Multi-Select Toggle for Exam Creation
  const toggleExamClass = (className) => {
    setExamForm((prev) => {
      const exists = prev.classesApplicable.includes(className);
      const updated = exists
        ? prev.classesApplicable.filter((c) => c !== className)
        : [...prev.classesApplicable, className];
      return { ...prev, classesApplicable: updated };
    });
  };

  const selectAllExamClasses = () => {
    setExamForm((prev) => ({
      ...prev,
      classesApplicable: prev.classesApplicable.length === standardClasses.length ? [] : [...standardClasses]
    }));
  };

  // Submission Handlers
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.post('/admin/student', studentForm);
      showNotification('success', `Student added! Generated Parent Password: ${res.data?.generatedPassword || 'Default set'}`);
      setStudentForm({ firstName: '', lastName: '', parentName: '', parentEmail: '', parentPhone: '', address: '', className: selectedStudentClass, rollNumber: '', photoUrl: '' });
      handleClassFilterChange(selectedStudentClass);
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to enroll student.');
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    const hasEmpty = assignedRows.some((r) => !r.className || !r.subject);
    if (hasEmpty) {
      return showNotification('error', 'Please select both class and subject for each assigned slot.');
    }

    const classesHandledPayload = assignedRows.map((r) => ({
      className: r.className,
      subjects: [r.subject],
    }));

    try {
      await axiosClient.post('/admin/teacher', {
        name: teacherForm.name,
        email: teacherForm.email,
        phone: teacherForm.phone,
        password: teacherForm.password,
        classesHandled: classesHandledPayload,
      });

      showNotification('success', 'Faculty member registered with assigned classes & subjects!');
      setTeacherForm({ name: '', email: '', phone: '', password: '' });
      setNumClasses(1);
      setAssignedRows([{ className: '', subject: '' }]);
      handleTeacherClassFilterChange(selectedTeacherClass);
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to create teacher.');
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/admin/class', classForm);
      showNotification('success', `Class ${classForm.className} created successfully!`);
      setClassForm({
        className: '',
        classTeacherId: ''
      });
      const classesRes = await axiosClient.get('/admin/classes');
      setClassesOverview(classesRes.data?.classes || []);
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to create class.');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/admin/announcement', announcementForm);
      showNotification('success', 'Notice published successfully! It will automatically expire and delete after the end date.');
      setAnnouncementForm({ title: '', description: '', targetClass: 'All', startDate: '', endDate: '' });
      fetchDashboardData();
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to publish notice.');
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Delete this announcement permanently?')) return;
    try {
      await axiosClient.delete(`/admin/announcement/${announcementId}`);
      showNotification('success', 'Announcement deleted successfully.');
      setAnnouncements(prev => prev.filter(a => a._id !== announcementId));
    } catch (err) {
      showNotification('error', 'Failed to delete announcement.');
    }
  };

  const handleCreateParent = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/admin/parent', {
        name: parentForm.name,
        email: parentForm.email,
        phone: parentForm.phone,
        password: parentForm.password,
        studentIds: parentForm.selectedStudentIds,
      });

      showNotification('success', `Parent account configured with ${parentForm.selectedStudentIds.length} linked child profile(s)!`);
      setParentForm({ name: '', email: '', phone: '', password: '', selectedStudentIds: [] });
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to register parent.');
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!examForm.classesApplicable || examForm.classesApplicable.length === 0) {
      return showNotification('error', 'Please select at least one class for this examination cycle.');
    }

    try {
      await axiosClient.post('/admin/exam', {
        ...examForm,
        classesApplicable: examForm.classesApplicable
      });
      showNotification('success', `Exam cycle "${examForm.examName}" scheduled for ${examForm.classesApplicable.length} class(es)!`);
      setExamForm({ 
        examName: '', 
        academicYear: '2025-2026', 
        term: 'Term 1', 
        classesApplicable: [], 
        startDate: '', 
        endDate: '' 
      });
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to schedule exam.');
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!selectedTargetClass) return showNotification('error', 'Please select a target class first.');
    if (!csvFile) return showNotification('error', 'Select a valid CSV file first.');

    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('targetClass', selectedTargetClass);

    try {
      await axiosClient.post('/admin/students/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showNotification('success', `Bulk upload processed for Class ${selectedTargetClass}!`);
      setCsvFile(null);
      setSelectedTargetClass('');
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Bulk upload failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Top Header Bar with Global Search & Profile Controls */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-tight text-indigo-900">EduConnect</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Admin Portal
            </span>
          </div>

          <form onSubmit={handleGlobalSearch} className="flex-1 max-w-lg relative">
            <input
              type="text"
              placeholder="Search Class (e.g. 10A), Student (e.g. Ananya), Subject, or Teacher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-24 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-1.5 top-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>

          <div 
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer p-1.5 hover:bg-slate-100 rounded-xl transition"
          >
            <img
              src={adminProfile.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt="Admin Profile"
              className="w-8 h-8 rounded-full object-cover border border-slate-300"
            />
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">{adminProfile.name || 'System Admin'}</p>
              <p className="text-[10px] text-slate-500">View & Edit Profile</p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Search Results Overlay */}
      {searchResults && (
        <div className="max-w-7xl mx-auto w-full px-6 pt-4">
          <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-lg relative">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-sm font-bold text-slate-800">
                Search Results for "{searchQuery}"
              </h3>
              <button 
                onClick={() => setSearchResults(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="border rounded-xl p-3 bg-slate-50">
                <h4 className="font-bold text-indigo-700 uppercase tracking-wider text-[11px] mb-2">Students ({searchResults.students?.length || 0})</h4>
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {searchResults.students?.map(s => (
                    <div key={s._id} className="p-2 bg-white rounded-lg border border-slate-200">
                      <p className="font-semibold text-slate-800">{s.firstName} {s.lastName}</p>
                      <p className="text-slate-500">Roll: {s.rollNumber} | Class: {s.className}</p>
                    </div>
                  ))}
                  {searchResults.students?.length === 0 && <p className="text-slate-400 text-center py-2">No students found</p>}
                </div>
              </div>

              <div className="border rounded-xl p-3 bg-slate-50">
                <h4 className="font-bold text-emerald-700 uppercase tracking-wider text-[11px] mb-2">Teachers ({searchResults.teachers?.length || 0})</h4>
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {searchResults.teachers?.map(t => (
                    <div key={t._id} className="p-2 bg-white rounded-lg border border-slate-200">
                      <p className="font-semibold text-slate-800">{t.name}</p>
                      <p className="text-slate-500">{t.email} | {t.phone}</p>
                    </div>
                  ))}
                  {searchResults.teachers?.length === 0 && <p className="text-slate-400 text-center py-2">No teachers found</p>}
                </div>
              </div>

              <div className="border rounded-xl p-3 bg-slate-50">
                <h4 className="font-bold text-amber-700 uppercase tracking-wider text-[11px] mb-2">Classes ({searchResults.classes?.length || 0})</h4>
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {searchResults.classes?.map(c => (
                    <div key={c._id} className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-800">Class {c.className}</p>
                        <p className="text-slate-500">Class Teacher: {c.classTeacher?.name || 'Unassigned'}</p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('classes');
                          handleViewClassDetails(c.className);
                          setSearchResults(null);
                        }}
                        className="text-indigo-600 font-bold hover:underline"
                      >
                        View
                      </button>
                    </div>
                  ))}
                  {searchResults.classes?.length === 0 && <p className="text-slate-400 text-center py-2">No classes found</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex flex-1 max-w-7xl w-full mx-auto p-6 gap-6">
        {/* Navigation Sidebar */}
        <div className="w-64 bg-white rounded-2xl border border-slate-200 p-4 h-fit space-y-2 shrink-0">
          {[
            { id: 'overview', label: 'Home', icon: BookOpen },
            { id: 'students', label: 'Student', icon: Users },
            { id: 'teachers', label: 'Teacher', icon: UserCheck },
            { id: 'classes', label: 'Class', icon: Layers },
            { id: 'parents', label: 'Parent', icon: HeartHandshake },
            { id: 'exams', label: 'Exams', icon: Calendar },
            { id: 'bulk', label: 'CSV Bulk Upload', icon: Upload },
            { id: 'audit', label: 'Audit Log', icon: ShieldAlert },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === id 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Dynamic Panel Content */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 min-w-0">
          {statusMsg.text && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm ${
              statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 1: HOME (OVERVIEW)                               */}
          {/* ==================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Home Dashboard</h2>
                <p className="text-xs text-slate-500">Live operational snapshot of students, faculty, classes, and daily attendance.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                  <p className="text-[11px] font-bold text-indigo-600 uppercase">Number of Students</p>
                  <p className="text-2xl font-black text-indigo-900 mt-1">{stats.studentCount}</p>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <p className="text-[11px] font-bold text-emerald-600 uppercase">Number of Teachers</p>
                  <p className="text-2xl font-black text-emerald-900 mt-1">{stats.teacherCount}</p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <p className="text-[11px] font-bold text-amber-600 uppercase">Number of Classes</p>
                  <p className="text-2xl font-black text-amber-900 mt-1">{stats.classCount}</p>
                </div>
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                  <p className="text-[11px] font-bold text-rose-600 uppercase">Today's Attendance</p>
                  <p className="text-2xl font-black text-rose-900 mt-1">{stats.todayAttendanceCount}</p>
                  <span className="text-[10px] text-rose-500">Updated from morning rosters</span>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-600" /> School Bulletins & Notices
                  </h3>
                  <span className="text-xs text-slate-400">Click card to inspect</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {announcements.map((ann) => (
                    <div
                      key={ann._id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition relative group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 
                          onClick={() => setSelectedAnnouncement(ann)}
                          className="text-xs font-bold text-slate-800 line-clamp-1 cursor-pointer hover:text-indigo-600 flex-1 pr-2"
                        >
                          {ann.title}
                        </h4>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAnnouncement(ann._id);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                          title="Delete Notice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p 
                        onClick={() => setSelectedAnnouncement(ann)}
                        className="text-[11px] text-slate-600 line-clamp-2 mb-2 cursor-pointer"
                      >
                        {ann.description}
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>Target: <strong className="text-slate-700">{ann.targetClass}</strong></span>
                        <span>
                          Valid: {new Date(ann.startDate).toLocaleDateString()} — {new Date(ann.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {announcements.length === 0 && (
                    <div className="col-span-2 p-6 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                      No active bulletins. Any expired bulletins are deleted automatically.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Broadcast New Notice to Teachers / Classes
                </h4>
                <form onSubmit={handleCreateAnnouncement} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      required
                      placeholder="Notice Title"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      className="border border-slate-300 rounded-lg p-2 text-xs bg-white"
                    />
                    <select
                      value={announcementForm.targetClass}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, targetClass: e.target.value })}
                      className="border border-slate-300 rounded-lg p-2 text-xs bg-white"
                    >
                      <option value="All">All School</option>
                      <option value="Teachers">Teachers Only</option>
                      {standardClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
                    </select>
                  </div>
                  <textarea
                    required
                    rows="2"
                    placeholder="Full Description / Body of notice..."
                    value={announcementForm.description}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, description: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Start Date</label>
                      <input
                        required
                        type="date"
                        value={announcementForm.startDate}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, startDate: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">End Date (Auto-Deletes After)</label>
                      <input
                        required
                        type="date"
                        value={announcementForm.endDate}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, endDate: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Publish Announcement
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: STUDENTS                                      */}
          {/* ==================================================== */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">School Council Members</h2>
                    <p className="text-xs text-slate-500">Student leadership body profiles and appointments</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCouncilForm({ id: '', name: '', position: '', photoUrl: '', contact: '' });
                      setIsCouncilModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add / Edit Member
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {councilMembers.map(member => (
                    <div key={member._id} className="p-3 bg-slate-50 border rounded-xl flex items-center gap-3 relative group">
                      <img
                        src={member.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover border"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate">{member.name}</p>
                        <p className="text-[11px] text-indigo-600 font-medium truncate">{member.position}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            setCouncilForm({
                              id: member._id,
                              name: member.name,
                              position: member.position,
                              photoUrl: member.photoUrl,
                              contact: member.contact
                            });
                            setIsCouncilModalOpen(true);
                          }}
                          className="text-slate-400 hover:text-indigo-600"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCouncilMember(member._id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {councilMembers.length === 0 && (
                    <p className="text-xs text-slate-400 col-span-4 p-3 text-center border rounded-xl">No council members listed.</p>
                  )}
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">All Students Roster</h3>
                    <p className="text-xs text-slate-500">Filter enrolled students by class section</p>
                  </div>
                  <div className="w-48">
                    <SearchableSelect
                      options={standardClasses}
                      value={selectedStudentClass}
                      onChange={handleClassFilterChange}
                      placeholder="Select Class Section"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b">
                      <tr>
                        <th className="p-2.5">Roll No</th>
                        <th className="p-2.5">Student Name</th>
                        <th className="p-2.5">Parent Email</th>
                        <th className="p-2.5">Parent Phone</th>
                        <th className="p-2.5">Address</th>
                        <th className="p-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentRoster.map(s => (
                        <tr key={s._id} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-bold text-indigo-900">{s.rollNumber}</td>
                          <td className="p-2.5 font-medium text-slate-800">{s.firstName} {s.lastName}</td>
                          <td className="p-2.5 text-slate-600">{s.parentEmail}</td>
                          <td className="p-2.5 text-slate-600">{s.parentPhone}</td>
                          <td className="p-2.5 text-slate-500 max-w-[150px] truncate">{s.address}</td>
                          <td className="p-2.5 text-right space-x-2">
                            <button
                              onClick={() => setEditingStudent(s)}
                              className="text-indigo-600 hover:text-indigo-800 font-semibold"
                            >
                              Modify
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(s._id)}
                              className="text-red-500 hover:text-red-700 font-semibold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {studentRoster.length === 0 && (
                        <tr>
                          <td colSpan="6" className="p-4 text-center text-slate-400">
                            No students enrolled in Class {selectedStudentClass}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="bg-slate-50/60 p-4 rounded-xl border">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Add Student to Class</h3>
                <form onSubmit={handleCreateStudent} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input required placeholder="First Name" value={studentForm.firstName} onChange={e => setStudentForm({...studentForm, firstName: e.target.value})} className="border p-2 rounded-lg text-xs bg-white" />
                  <input required placeholder="Last Name" value={studentForm.lastName} onChange={e => setStudentForm({...studentForm, lastName: e.target.value})} className="border p-2 rounded-lg text-xs bg-white" />
                  <select value={studentForm.className} onChange={e => setStudentForm({...studentForm, className: e.target.value})} className="border p-2 rounded-lg text-xs bg-white">
                    {standardClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                  <input required placeholder="Roll Number (e.g. 10A01)" value={studentForm.rollNumber} onChange={e => setStudentForm({...studentForm, rollNumber: e.target.value})} className="border p-2 rounded-lg text-xs bg-white" />
                  <input required placeholder="Parent Full Name" value={studentForm.parentName} onChange={e => setStudentForm({...studentForm, parentName: e.target.value})} className="border p-2 rounded-lg text-xs bg-white" />
                  <input required type="email" placeholder="Parent Email" value={studentForm.parentEmail} onChange={e => setStudentForm({...studentForm, parentEmail: e.target.value})} className="border p-2 rounded-lg text-xs bg-white" />
                  <input required placeholder="Parent Phone" value={studentForm.parentPhone} onChange={e => setStudentForm({...studentForm, parentPhone: e.target.value})} className="border p-2 rounded-lg text-xs bg-white" />
                  <input required placeholder="Residential Address" value={studentForm.address} onChange={e => setStudentForm({...studentForm, address: e.target.value})} className="border p-2 rounded-lg text-xs bg-white" />
                  <input placeholder="Student Photo URL (Optional)" value={studentForm.photoUrl} onChange={e => setStudentForm({...studentForm, photoUrl: e.target.value})} className="border p-2 rounded-lg text-xs bg-white" />
                  <button type="submit" className="md:col-span-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-xs transition">
                    Enroll Student
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: TEACHERS                                      */}
          {/* ==================================================== */}
          {activeTab === 'teachers' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-1">School Leadership Directory</h2>
                <p className="text-xs text-slate-500 mb-3">Institutional leadership personnel and designated class mentors</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {leadership.map(person => (
                    <div key={person._id} className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center gap-3">
                      <img
                        src={person.photoUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'}
                        alt={person.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
                      />
                      <div>
                        <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">{person.role}</p>
                        <p className="text-sm font-bold text-slate-800">{person.name}</p>
                        <p className="text-xs text-slate-500">{person.email} | {person.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Assigned Faculty by Class</h3>
                    <p className="text-xs text-slate-500">Class Teacher listed first, followed by subject specialists</p>
                  </div>
                  <div className="w-48">
                    <SearchableSelect
                      options={standardClasses}
                      value={selectedTeacherClass}
                      onChange={handleTeacherClassFilterChange}
                      placeholder="Select Class"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b">
                      <tr>
                        <th className="p-2.5">Faculty Name</th>
                        <th className="p-2.5">Subject Handled</th>
                        <th className="p-2.5">Role</th>
                        <th className="p-2.5">Email</th>
                        <th className="p-2.5">Phone</th>
                        <th className="p-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classTeachersList.map(t => (
                        <tr key={t.id || t.email} className={t.isClassTeacher ? 'bg-indigo-50/40 font-semibold' : 'hover:bg-slate-50/60'}>
                          <td className="p-2.5 text-slate-800">{t.name}</td>
                          <td className="p-2.5 text-slate-600">{t.subject}</td>
                          <td className="p-2.5">
                            {t.isClassTeacher ? (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                                Class Teacher
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Subject Faculty</span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-600">{t.email}</td>
                          <td className="p-2.5 text-slate-600">{t.phone}</td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => handleDeleteTeacher(t.id)}
                              className="text-red-500 hover:text-red-700 font-semibold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {classTeachersList.length === 0 && (
                        <tr>
                          <td colSpan="6" className="p-4 text-center text-slate-400">
                            No faculty assigned to Class {selectedTeacherClass} yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="bg-slate-50/60 p-4 rounded-xl border">
                <h3 className="text-sm font-bold text-slate-800 mb-2">Register Faculty Member</h3>
                <p className="text-xs text-slate-500 mb-4">Set credentials and configure dynamic class-subject combinations handled.</p>

                <form onSubmit={handleCreateTeacher} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input required placeholder="Teacher Full Name" value={teacherForm.name} onChange={e => setTeacherForm({...teacherForm, name: e.target.value})} className="border p-2 rounded-lg text-xs bg-white" />
                    <input required type="email" placeholder="Email Address" value={teacherForm.email} onChange={e => setTeacherForm({...teacherForm, email: e.target.value})} className="border p-2 rounded-lg text-xs bg-white" />
                    <input required placeholder="Phone Number" value={teacherForm.phone} onChange={e => setTeacherForm({...teacherForm, phone: e.target.value})} className="border p-2 rounded-lg text-xs bg-white" />
                    <input required type="password" placeholder="Temporary Password" value={teacherForm.password} onChange={e => setTeacherForm({...teacherForm, password: e.target.value})} className="border p-2 rounded-lg text-xs bg-white" />
                  </div>

                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Number of Classes Handled</h4>
                      <p className="text-[11px] text-slate-500">Specifies how many slot rows to generate</p>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={numClasses}
                      onChange={handleNumClassesChange}
                      className="w-20 text-center font-bold border p-1.5 rounded-lg text-xs bg-slate-50"
                    />
                  </div>

                  <div className="space-y-2">
                    {assignedRows.map((row, index) => (
                      <div key={index} className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-white">
                        <SearchableSelect
                          label={`Class for Slot #${index + 1}`}
                          options={standardClasses}
                          value={row.className}
                          onChange={(val) => handleRowChange(index, 'className', val)}
                          placeholder="Select Class..."
                        />
                        <SearchableSelect
                          label={`Subject for Slot #${index + 1}`}
                          options={standardSubjects}
                          value={row.subject}
                          onChange={(val) => handleRowChange(index, 'subject', val)}
                          placeholder="Select Subject..."
                        />
                      </div>
                    ))}
                  </div>

                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-xs transition">
                    Create Teacher
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: CLASSES (Simplified: Name and Class Teacher only) */}
          {/* ==================================================== */}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              {selectedClassDetail && (
                <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl relative">
                  <div className="flex justify-between items-start mb-3 border-b border-indigo-100 pb-2">
                    <div>
                      <h3 className="text-base font-bold text-indigo-950">Detailed Breakdown: Class {selectedClassDetail.className}</h3>
                      <p className="text-xs text-slate-600">
                        Class Teacher: <span className="font-semibold text-slate-800">{selectedClassDetail.classTeacher?.name || 'Unassigned'}</span> ({selectedClassDetail.classTeacher?.email || 'N/A'})
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedClassDetail(null)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Enrolled Students ({selectedClassDetail.students?.length || 0})
                    </h4>
                    <div className="max-h-48 overflow-y-auto border rounded-lg bg-white divide-y">
                      {selectedClassDetail.students?.map(st => (
                        <div key={st._id} className="p-2 text-xs flex justify-between">
                          <span className="font-bold text-indigo-900">{st.rollNumber} - {st.firstName} {st.lastName}</span>
                          <span className="text-slate-500">{st.parentPhone}</span>
                        </div>
                      ))}
                      {selectedClassDetail.students?.length === 0 && (
                        <p className="text-xs text-slate-400 p-3 text-center">No students enrolled yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-1">Configured Classes</h2>
                <p className="text-xs text-slate-500 mb-3">All class sections, assigned class teachers, and enrolled student totals</p>

                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b">
                      <tr>
                        <th className="p-2.5">Class Name</th>
                        <th className="p-2.5">Class Teacher</th>
                        <th className="p-2.5">Student Count</th>
                        <th className="p-2.5 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classesOverview.map(c => (
                        <tr key={c._id} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-bold text-slate-800">Class {c.className}</td>
                          <td className="p-2.5 text-slate-600">{c.classTeacherName}</td>
                          <td className="p-2.5 font-semibold text-indigo-700">{c.studentCount}</td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => handleViewClassDetails(c.className)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 ml-auto"
                            >
                              <Eye className="w-3.5 h-3.5" /> Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                      {classesOverview.length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-4 text-center text-slate-400">No classes configured yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="bg-slate-50/60 p-4 rounded-xl border">
                <h3 className="text-sm font-bold text-slate-800 mb-2">Create & Configure Class</h3>
                <p className="text-xs text-slate-500 mb-4">Assign primary class teacher</p>

                <form onSubmit={handleCreateClass} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      required
                      placeholder="Class Name (e.g. 10A)"
                      value={classForm.className}
                      onChange={e => setClassForm({...classForm, className: e.target.value})}
                      className="border p-2 rounded-lg text-xs bg-white"
                    />
                    <select
                      value={classForm.classTeacherId}
                      onChange={e => setClassForm({...classForm, classTeacherId: e.target.value})}
                      className="border p-2 rounded-lg text-xs bg-white"
                    >
                      <option value="">Select Primary Class Teacher</option>
                      {teachersList.map(t => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
                    </select>
                  </div>

                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-xs transition">
                    Save Class Configuration
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 5: PARENTS                                       */}
          {/* ==================================================== */}
          {activeTab === 'parents' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Parent Account Registration</h2>
                <p className="text-xs text-slate-500">Create parent credentials and link multiple enrolled students for single-login sibling switching</p>
              </div>

              <form onSubmit={handleCreateParent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input required placeholder="Parent Full Name" value={parentForm.name} onChange={e => setParentForm({...parentForm, name: e.target.value})} className="border p-2 rounded-lg text-xs" />
                  <input required type="email" placeholder="Parent Email" value={parentForm.email} onChange={e => setParentForm({...parentForm, email: e.target.value})} className="border p-2 rounded-lg text-xs" />
                  <input required placeholder="Phone Number" value={parentForm.phone} onChange={e => setParentForm({...parentForm, phone: e.target.value})} className="border p-2 rounded-lg text-xs" />
                  <input required type="password" placeholder="Temporary Password" value={parentForm.password} onChange={e => setParentForm({...parentForm, password: e.target.value})} className="border p-2 rounded-lg text-xs" />
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Select Children (Multi-Sibling Linking)</h4>
                  <div className="border rounded-xl p-3 max-h-56 overflow-y-auto divide-y bg-slate-50">
                    {studentsList.map(st => {
                      const isSelected = parentForm.selectedStudentIds.includes(st._id);
                      return (
                        <div
                          key={st._id}
                          onClick={() => toggleStudentSelection(st._id)}
                          className={`p-2 rounded-lg cursor-pointer flex justify-between items-center ${isSelected ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-white'}`}
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800">{st.firstName} {st.lastName}</p>
                            <p className="text-[10px] text-slate-500">Roll: {st.rollNumber} | Class: {st.className}</p>
                          </div>
                          <input type="checkbox" checked={isSelected} onChange={() => {}} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-xs transition">
                  Register Parent & Link Children
                </button>
              </form>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 6: EXAMS                                         */}
          {/* ==================================================== */}
          {activeTab === 'exams' && (
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Create Dynamic Exam Term</h2>
              <p className="text-xs text-slate-500 mb-4">Define terms, target grades, and operational dates</p>
              
              <form onSubmit={handleCreateExam} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Exam Cycle Title</label>
                  <input 
                    required 
                    placeholder="e.g. Mid-Term Assessment 2026" 
                    value={examForm.examName} 
                    onChange={e => setExamForm({...examForm, examName: e.target.value})} 
                    className="w-full border p-2 rounded-lg text-xs bg-white" 
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Academic Year</label>
                  <input 
                    required 
                    placeholder="2025-2026" 
                    value={examForm.academicYear} 
                    onChange={e => setExamForm({...examForm, academicYear: e.target.value})} 
                    className="w-full border p-2 rounded-lg text-xs bg-white" 
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Term / Cycle</label>
                  <input 
                    required 
                    placeholder="e.g. Term 1, FA-1, Finals" 
                    value={examForm.term} 
                    onChange={e => setExamForm({...examForm, term: e.target.value})} 
                    className="w-full border p-2 rounded-lg text-xs bg-white" 
                  />
                </div>

                <div className="col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Applicable Classes ({examForm.classesApplicable.length} Selected)
                    </label>
                    <button
                      type="button"
                      onClick={selectAllExamClasses}
                      className="text-xs text-indigo-600 font-bold hover:underline"
                    >
                      {examForm.classesApplicable.length === standardClasses.length ? 'Clear All' : 'Select All Classes'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">Click on the sections below to apply this exam cycle:</p>

                  <div className="flex flex-wrap gap-2">
                    {standardClasses.map((cls) => {
                      const isSelected = examForm.classesApplicable.includes(cls);
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => toggleExamClass(cls)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          Class {cls} {isSelected ? '✓' : '+'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Start Date</label>
                  <input 
                    required 
                    type="date" 
                    value={examForm.startDate} 
                    onChange={e => setExamForm({...examForm, startDate: e.target.value})} 
                    className="w-full border p-2 rounded-lg text-xs bg-white" 
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">End Date</label>
                  <input 
                    required 
                    type="date" 
                    value={examForm.endDate} 
                    onChange={e => setExamForm({...examForm, endDate: e.target.value})} 
                    className="w-full border p-2 rounded-lg text-xs bg-white" 
                  />
                </div>

                <button 
                  type="submit" 
                  className="col-span-2 bg-indigo-600 text-white font-semibold py-2.5 rounded-lg text-xs hover:bg-indigo-700 transition shadow-xs"
                >
                  Schedule Exam Cycle
                </button>
              </form>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 7: CSV BULK UPLOAD                               */}
          {/* ==================================================== */}
          {activeTab === 'bulk' && (
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">CSV Bulk Student Import</h2>
              <p className="text-xs text-slate-500 mb-4">Select target section to assign batch entries automatically</p>

              <form onSubmit={handleCsvUpload} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Target Section</label>
                  <select
                    value={selectedTargetClass}
                    onChange={(e) => setSelectedTargetClass(e.target.value)}
                    className="w-full border p-2.5 rounded-lg text-xs bg-white"
                  >
                    <option value="">Select Target Class (e.g. 10A)</option>
                    {standardClasses.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Spreadsheet (.csv)</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>

                <button type="submit" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition">
                  Upload & Enroll into {selectedTargetClass ? `Class ${selectedTargetClass}` : 'Class'}
                </button>
              </form>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 8: AUDIT LOGS                                    */}
          {/* ==================================================== */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Security & Audit Logs</h2>
                  <p className="text-xs text-slate-500">Immutable trace of all administrative operations and remote IPs</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Filter by keyword / IP..."
                    value={auditKeyword}
                    onChange={(e) => setAuditKeyword(e.target.value)}
                    className="border p-1.5 px-3 rounded-lg text-xs bg-white"
                  />
                  <button
                    onClick={() => fetchAuditLogs(auditKeyword)}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                  >
                    Filter
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b">
                    <tr>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">User</th>
                      <th className="p-2.5">Action</th>
                      <th className="p-2.5">IP Address</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/60">
                        <td className="p-2.5 text-slate-500">{new Date(log.createdAt || log.timestamp).toLocaleString()}</td>
                        <td className="p-2.5 font-medium text-slate-800">{log.userId?.email || 'System / Anonymous'}</td>
                        <td className="p-2.5 text-slate-600">{log.action}</td>
                        <td className="p-2.5 text-slate-400 font-mono text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === 'Success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-slate-400">No logs found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-base font-bold text-slate-800">Admin Personal Profile</h3>
              <button onClick={() => setIsProfileOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  required
                  value={adminProfile.name}
                  onChange={(e) => setAdminProfile({ ...adminProfile, name: e.target.value })}
                  className="w-full border p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Email (Read Only)</label>
                <input
                  disabled
                  value={adminProfile.email}
                  className="w-full border p-2 rounded-lg bg-slate-100 text-slate-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Contact Phone</label>
                <input
                  value={adminProfile.phone}
                  onChange={(e) => setAdminProfile({ ...adminProfile, phone: e.target.value })}
                  className="w-full border p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Avatar Image URL</label>
                <input
                  value={adminProfile.profileImage}
                  onChange={(e) => setAdminProfile({ ...adminProfile, profileImage: e.target.value })}
                  className="w-full border p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Administrative Bio / Notes</label>
                <textarea
                  rows="3"
                  value={adminProfile.bio}
                  onChange={(e) => setAdminProfile({ ...adminProfile, bio: e.target.value })}
                  className="w-full border p-2 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex justify-between items-start mb-3 border-b pb-2">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase">
                  Target: {selectedAnnouncement.targetClass}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedAnnouncement.title}</h3>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed mb-4 whitespace-pre-line">
              {selectedAnnouncement.description}
            </p>

            <div className="text-[11px] text-slate-500 border-t pt-3 flex justify-between">
              <span><strong>Start Date:</strong> {new Date(selectedAnnouncement.startDate).toLocaleDateString()}</span>
              <span><strong>End Date:</strong> {new Date(selectedAnnouncement.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

      {isCouncilModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-3 border-b pb-2">
              <h3 className="text-sm font-bold text-slate-800">
                {councilForm.id ? 'Edit Council Member' : 'Add Council Member'}
              </h3>
              <button onClick={() => setIsCouncilModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCouncilMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Student Full Name</label>
                <input
                  required
                  placeholder="e.g. Rahul Verma"
                  value={councilForm.name}
                  onChange={(e) => setCouncilForm({ ...councilForm, name: e.target.value })}
                  className="w-full border p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Position / Office</label>
                <input
                  required
                  placeholder="e.g. Head Boy, Sports Captain"
                  value={councilForm.position}
                  onChange={(e) => setCouncilForm({ ...councilForm, position: e.target.value })}
                  className="w-full border p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Photo URL (Optional)</label>
                <input
                  placeholder="https://..."
                  value={councilForm.photoUrl}
                  onChange={(e) => setCouncilForm({ ...councilForm, photoUrl: e.target.value })}
                  className="w-full border p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Contact Note (Optional)</label>
                <input
                  placeholder="Grade / Section info"
                  value={councilForm.contact}
                  onChange={(e) => setCouncilForm({ ...councilForm, contact: e.target.value })}
                  className="w-full border p-2 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCouncilModalOpen(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-3 border-b pb-2">
              <h3 className="text-sm font-bold text-slate-800">Modify Student Record: {editingStudent.rollNumber}</h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudentSubmit} className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">First Name</label>
                <input
                  required
                  value={editingStudent.firstName}
                  onChange={(e) => setEditingStudent({ ...editingStudent, firstName: e.target.value })}
                  className="w-full border p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Last Name</label>
                <input
                  required
                  value={editingStudent.lastName}
                  onChange={(e) => setEditingStudent({ ...editingStudent, lastName: e.target.value })}
                  className="w-full border p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Parent Name</label>
                <input
                  required
                  value={editingStudent.parentName}
                  onChange={(e) => setEditingStudent({ ...editingStudent, parentName: e.target.value })}
                  className="w-full border p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Parent Phone</label>
                <input
                  required
                  value={editingStudent.parentPhone}
                  onChange={(e) => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })}
                  className="w-full border p-2 rounded-lg"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-slate-600 mb-1">Residential Address</label>
                <input
                  required
                  value={editingStudent.address}
                  onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })}
                  className="w-full border p-2 rounded-lg"
                />
              </div>

              <div className="col-span-2 pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;