import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ProgramSetupSidebarComponent } from './program-setup-sidebar.component';
export function httpTranslateLoader(http: HttpClient) {

}
describe('ProgramSetupSidebarComponent', () => {
  let component: ProgramSetupSidebarComponent;
  let fixture: ComponentFixture<ProgramSetupSidebarComponent>;
  CommonTestingModule.setUpTestBed(ProgramSetupSidebarComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [],
      declarations: [ProgramSetupSidebarComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramSetupSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
