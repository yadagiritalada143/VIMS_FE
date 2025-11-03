import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ChildRendererComponent } from './child-renderer.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ChildRendererComponent', () => {
  let component: ChildRendererComponent;
  let fixture: ComponentFixture<ChildRendererComponent>;
  CommonTestingModule.setUpTestBed(ChildRendererComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ChildRendererComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
