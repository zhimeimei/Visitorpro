
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { ICONS } from '../constants';
import { dataService } from '../services/dataService';

interface UserManagementModalProps {
  onClose: () => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null); // null = adding new, object = editing

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(dataService.getUsers());
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setLoginCode(user.loginCode);
    setRole(user.role);
    setIsEditing(true);
  };

  const startAdd = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setLoginCode(generateRandomCode());
    setRole(UserRole.USER);
    setIsEditing(true);
  };

  const generateRandomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除该账号吗？此操作不可撤销。')) {
      try {
        dataService.deleteUser(id);
        loadUsers();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleSave = () => {
    if (!name || !username || !loginCode) {
      alert('请填写完整信息');
      return;
    }

    // Check username uniqueness if adding or changing username
    const existingUser = users.find(u => u.username === username && u.id !== editingUser?.id);
    if (existingUser) {
      alert('该账号用户名已存在，请更换。');
      return;
    }

    const userToSave: User = {
      id: editingUser ? editingUser.id : `u-${Date.now()}`,
      name,
      username,
      loginCode,
      role
    };

    dataService.saveUser(userToSave);
    setIsEditing(false);
    loadUsers();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <ICONS.Settings size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">后台账号管理</h3>
              <p className="text-sm text-slate-300">管理机构成员账号及登录权限</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <ICONS.X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {isEditing ? (
            <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                {editingUser ? <ICONS.Edit3 size={20}/> : <ICONS.Plus size={20}/>}
                {editingUser ? '编辑账号' : '新增账号'}
              </h4>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="如：接待专员A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">登录账号 (Username)</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="用于登录的唯一标识"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">登录码 (Code)</label>
                  <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={loginCode}
                        onChange={e => setLoginCode(e.target.value)}
                        className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-mono tracking-wider text-center bg-gray-50"
                        placeholder="6位数字"
                     />
                     <button 
                       onClick={() => setLoginCode(generateRandomCode())}
                       className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition"
                     >
                       随机生成
                     </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">请将此码发放给该用户用于登录验证。</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">角色权限</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setRole(UserRole.USER)}
                      className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition ${role === UserRole.USER ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-200 text-gray-600'}`}
                    >
                      <ICONS.User size={18} />
                      普通用户
                    </button>
                    <button 
                      onClick={() => setRole(UserRole.ADMIN)}
                      className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition ${role === UserRole.ADMIN ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-gray-200 text-gray-600'}`}
                    >
                      <ICONS.Shield size={18} />
                      管理员
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleSave}
                    className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition shadow-lg shadow-brand-500/30"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">共 {users.length} 个账号</p>
                <button 
                  onClick={startAdd}
                  className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow-sm"
                >
                  <ICONS.Plus size={18} /> 新增账号
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                    <tr>
                      <th className="p-4">姓名</th>
                      <th className="p-4">账号</th>
                      <th className="p-4">登录码</th>
                      <th className="p-4">角色</th>
                      <th className="p-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs">
                             {user.name.charAt(0)}
                           </div>
                           {user.name}
                        </td>
                        <td className="p-4 text-gray-600 font-mono">{user.username}</td>
                        <td className="p-4">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono text-xs border border-gray-200">
                            {user.loginCode}
                          </span>
                        </td>
                        <td className="p-4">
                          {user.role === UserRole.ADMIN ? (
                            <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full text-xs font-medium w-fit">
                              <ICONS.Shield size={12} /> 管理员
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium w-fit">
                              <ICONS.User size={12} /> 普通用户
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => startEdit(user)}
                              className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition"
                              title="编辑"
                            >
                              <ICONS.Edit3 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(user.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="删除"
                            >
                              <ICONS.Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg text-sm text-yellow-700 flex items-start gap-3">
                <ICONS.AlertCircle className="shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="font-bold mb-1">安全提示</p>
                  <p>登录码是用户登录系统的唯一凭证，请妥善保管并直接发送给相关人员。建议定期更新登录码以确保安全。</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;
