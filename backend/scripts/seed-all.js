import { User, Book, Package, Order } from '../models/index.js';
import connectDB from '../config/database.js';
import bcrypt from 'bcryptjs';

const seedAll = async () => {
    try {
        await connectDB();
        console.log('🌱 Starting full database seeding...');

        // 1. Create Admin
        const adminData = {
            name: 'System Admin',
            email: 'admin@ebook.com',
            password: 'Admin@123',
            role: 'admin',
            isEmailVerified: true
        };
        const [admin, adminCreated] = await User.findOrCreate({
            where: { email: adminData.email },
            defaults: adminData
        });
        if (adminCreated) console.log('✅ Admin created: admin@ebook.com');
        else console.log('ℹ️ Admin already exists');

        // 2. Create Vendor
        const vendorData = {
            name: 'Creative Books Vendor',
            email: 'vendor@ebook.com',
            password: 'Vendor@123',
            role: 'vendor',
            isEmailVerified: true,
            vendorDetails: {
                storeName: 'Creative Books Hub',
                address: '123 Publishing St, Book Town',
                licenseId: 'LIC-7890-VENDOR'
            }
        };
        const [vendor, vendorCreated] = await User.findOrCreate({
            where: { email: vendorData.email },
            defaults: vendorData
        });
        if (vendorCreated) console.log('✅ Vendor created: vendor@ebook.com');
        else console.log('ℹ️ Vendor already exists');

        // 3. Create Reader
        const readerData = {
            name: 'John Reader',
            email: 'reader@ebook.com',
            password: 'Reader@123',
            role: 'reader',
            isEmailVerified: true
        };
        const [reader, readerCreated] = await User.findOrCreate({
            where: { email: readerData.email },
            defaults: readerData
        });
        if (readerCreated) console.log('✅ Reader created: reader@ebook.com');
        else console.log('ℹ️ Reader already exists');

        // 4. Create Demo Books
        const demoBooks = [
            {
                title: "The Midnight Library",
                author: "Matt Haig",
                description: "Between life and death there is a library, and within that library, the shelves go on forever.",
                category: "Fiction",
                retailPrice: 599.00,
                wholesalePrice: 350.00,
                coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400",
                fileUrl: "/uploads/books/sample.pdf",
                isAvailable: true,
                isApproved: true
            },
            {
                title: "Atomic Habits",
                author: "James Clear",
                description: "Proven framework for improving—every day.",
                category: "Self-Help",
                retailPrice: 450.00,
                wholesalePrice: 280.00,
                coverImage: "https://images.unsplash.com/photo-1589998059171-988d887df643?q=80&w=400",
                fileUrl: "/uploads/books/sample.pdf",
                isAvailable: true,
                isApproved: true
            },
            {
                title: "Deep Work",
                author: "Cal Newport",
                description: "Ability to focus without distraction.",
                category: "Technology",
                retailPrice: 499.00,
                wholesalePrice: 300.00,
                coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400",
                fileUrl: "/uploads/books/sample.pdf",
                isAvailable: true,
                isApproved: true
            }
        ];

        for (const bookData of demoBooks) {
            const [book, created] = await Book.findOrCreate({
                where: { title: bookData.title },
                defaults: bookData
            });
            if (created) console.log(`✅ Book added: ${book.title}`);
            else console.log(`ℹ️ Book already exists: ${book.title}`);
        }

        // 5. Create Demo Packages
        const demoPackages = [
            {
                name: "Student Lite",
                description: "Perfect for casual readers and students.",
                bookLimit: 5,
                isUnlimited: false,
                monthlyPrice: 199.00,
                yearlyPrice: 1990.00,
                features: ["Access to 5 books/month", "Standard support", "Offline reading (App)"],
                displayOrder: 1
            },
            {
                name: "Pro Reader",
                description: "Most popular plan for book lovers.",
                bookLimit: 0,
                isUnlimited: true,
                hasVerifiedBadge: true,
                isRecommended: true,
                monthlyPrice: 499.00,
                yearlyPrice: 4990.00,
                features: ["Unlimited books", "Priority support", "Exclusive content", "Badge on profile"],
                displayOrder: 2
            },
            {
                name: "Elite Scholar",
                description: "Lifetime access for the ultimate researcher.",
                bookLimit: 0,
                isUnlimited: true,
                hasVerifiedBadge: true,
                monthlyPrice: 999.00,
                yearlyPrice: 0, // Not applicable for lifetime focus
                lifetimePrice: 14999.00,
                features: ["Everything in Pro", "Early access to new releases", "Direct author Q&A", "Physical copy discounts"],
                displayOrder: 3
            }
        ];

        for (const pkgData of demoPackages) {
            const [pkg, created] = await Package.findOrCreate({
                where: { name: pkgData.name },
                defaults: pkgData
            });
            if (created) console.log(`✅ Package added: ${pkg.name}`);
            else console.log(`ℹ️ Package already exists: ${pkg.name}`);
        }

        // 6. Create Demo Orders for Reports
        console.log('📦 Generating demo orders for reports...');
        const allBooks = await Book.findAll();
        const readerUser = await User.findOne({ where: { email: 'reader@ebook.com' } });
        const vendorUser = await User.findOne({ where: { email: 'vendor@ebook.com' } });

        if (allBooks.length > 0 && readerUser && vendorUser) {
            const orderCount = 10;
            for (let i = 0; i < orderCount; i++) {
                const randomBook = allBooks[Math.floor(Math.random() * allBooks.length)];
                const orderData = {
                    orderNumber: `ORD-DEMO-${Date.now()}-${i}`,
                    customerId: readerUser.id,
                    customerName: readerUser.name,
                    customerEmail: readerUser.email,
                    orderType: 'book',
                    items: [{
                        id: randomBook.id,
                        title: randomBook.title,
                        category: randomBook.category,
                        price: randomBook.retailPrice,
                        quantity: 1
                    }],
                    subtotal: randomBook.retailPrice,
                    total: randomBook.retailPrice,
                    purchasedFrom: 'vendor',
                    vendorId: vendorUser.id,
                    commission: randomBook.retailPrice * 0.15,
                    vendorEarnings: randomBook.retailPrice * 0.85,
                    paymentStatus: 'completed',
                    status: 'completed',
                    createdAt: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)) // Random date in last 30 days
                };

                await Order.create(orderData);

                // Update Book Stats
                await randomBook.increment('totalSales', { by: 1 });
                await randomBook.increment('totalRevenue', { by: randomBook.retailPrice });
            }
            console.log(`✅ ${orderCount} Demo orders created successfully`);
        }

        console.log('✨ Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedAll();
