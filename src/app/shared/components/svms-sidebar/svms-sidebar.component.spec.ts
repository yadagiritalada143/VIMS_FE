import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SvmsSidebarComponent } from './svms-sidebar.component';

describe('SvmsSidebarComponent', () => {
  let component: SvmsSidebarComponent;
  let fixture: ComponentFixture<SvmsSidebarComponent>;
  CommonTestingModule.setUpTestBed(SvmsSidebarComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsSidebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
