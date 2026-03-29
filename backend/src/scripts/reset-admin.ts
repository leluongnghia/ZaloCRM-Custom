import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdmin() {
  const args = process.argv.slice(2);
  const email = args[0] || 'admin@example.com'; 
  const newPassword = args[1] || 'Admin@123';

  try {
    const adminUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { role: 'owner' },
          { email: email }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    if (!adminUser) {
      console.log('Không tìm thấy tài khoản admin hoặc owner nào trong hệ thống.');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: adminUser.id },
      data: { passwordHash: hashedPassword }
    });

    console.log(`\n✅ Đặt lại mật khẩu thành công!`);
    console.log(`👤 Tài khoản (Email): ${adminUser.email}`);
    console.log(`🔑 Mật khẩu mới: ${newPassword}\n`);

  } catch (err) {
    console.error('Lỗi khi đặt lại mật khẩu:', err);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();
